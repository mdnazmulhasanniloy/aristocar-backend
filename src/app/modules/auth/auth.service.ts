import jwt, { JwtPayload, Secret } from 'jsonwebtoken';
import httpStatus from 'http-status';
import AppError from '../../error/AppError';
import {
  IJwtPayload,
  TChangePassword,
  TLogin,
  TResetPassword,
} from './auth.interface';
import config from '../../config';
import { createToken, verifyToken } from './auth.utils';
import { generateOtp } from '../../utils/otpGenerator';
import moment from 'moment';
import { sendEmail } from '../../utils/mailSender';
import bcrypt from 'bcrypt';
import { IUser } from '../user/user.interface';
import { User } from '../user/user.models';
import path from 'path';
import fs from 'fs';
import { USER_ROLE } from '../user/user.constants';

// Login
const login = async (payload: TLogin) => {
let user = await User.findOne({email:payload?.email});
console.log('user',user);
  if (!user) {
    if (payload.isGoogleLogin) {
      user = await User.create({
        email: payload.email,
        name : payload.name,
        isGoogleLogin: true,
        password: '',
        role: USER_ROLE.user,
        verification: {
          status: true,
        },
      });
    } else {
      throw new AppError(httpStatus.NOT_FOUND, 'User not found');
    }
  } else {
    if (user?.isDeleted) {
      throw new AppError(httpStatus.FORBIDDEN, 'This user is deleted');
    }

    // If the user is registered with Google, enforce Google login
    if (user.isGoogleLogin && !payload.isGoogleLogin) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'You have to login with google ',
      );
    }

    // If the user is not registered with Google but payload has isGoogleLogin
    if (!user.isGoogleLogin && payload.isGoogleLogin) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'You dont have google login with this email',
      );
    }

    // Handle Google login case
    if (user.isGoogleLogin) {
      if (!user?.verification?.status) {
        throw new AppError(
          httpStatus.FORBIDDEN,
          'User account is not verified',
        );
      }
    } else {
      // Handle non-Google login case, verify password
      const passwordMatched = await User.isPasswordMatched(
        payload.password as any,
        user.password,
      );
      if (!passwordMatched) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Password does not match');
      }
    }
    if (!user?.verification?.status) {
      throw new AppError(httpStatus.FORBIDDEN, 'User account is not verified');
    }
  }

  const jwtPayload: { userId: string; role: string } = {
    userId: user?._id?.toString() as string,
    role: user?.role,
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string,
  );

  const refreshToken = createToken(
    jwtPayload,
    config.jwt_refresh_secret as string,
    config.jwt_refresh_expires_in as string,
  );

  return {
    user,
    accessToken,
    refreshToken,
  };
};

// Change password
const changePassword = async (id: string, payload: TChangePassword) => {
  const user = await User.IsUserExistId(id);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (!(await User.isPasswordMatched(payload?.oldPassword, user.password))) {
    throw new AppError(httpStatus.FORBIDDEN, 'Old password does not match');
  }
  if (payload?.newPassword !== payload?.confirmPassword) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'New password and confirm password do not match',
    );
  }

  const hashedPassword = await bcrypt.hash(
    payload?.newPassword,
    Number(config.bcrypt_salt_rounds),
  );

  const result = await User.findByIdAndUpdate(
    id,
    {
      $set: {
        password: hashedPassword,
        passwordChangedAt: new Date(),
      },
    },
    { new: true },
  );

  return result;
};

// Forgot password
const forgotPassword = async (email: string) => {
  
  const user = await User.findOne({email:email});

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }
  if (user?.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  const jwtPayload = {
    email: email,
    userId: user?._id,
  };

  const token = jwt.sign(jwtPayload, config.jwt_access_secret as Secret, {
    expiresIn: '3m',
  });

  const currentTime = new Date();
  const otp = generateOtp();
  const expiresAt = moment(currentTime).add(3, 'minute');

  await User.findByIdAndUpdate(user?._id, {
    verification: {
      otp,
      expiresAt,
    },
  });

  const otpEmailPath = path.join(
    __dirname,
    '../../../../public/view/forgot_pass_mail.html',
  );

  await sendEmail(
    user?.email,
    'Your reset password OTP is',
    fs
      .readFileSync(otpEmailPath, 'utf8')
      .replace('{{otp}}', otp)
      .replace('{{email}}', user?.email),
  );

  // await sendEmail(
  //   email,
  //   'Your reset password OTP is:',
  //   `<div><h5>Your OTP is: ${otp}</h5>
  //   <p>Valid until: ${expiresAt.toLocaleString()}</p>
  //   </div>`,
  // );

  return { email, token };
};

// Reset password
const resetPassword = async (token: string, payload: TResetPassword) => {
  let decode;
  try {
    decode = jwt.verify(
      token,
      config.jwt_access_secret as string,
    ) as JwtPayload;
  } catch (err) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      'Session has expired. Please try again',
    );
  }

  const user: IUser | null = await User.findById(decode?.userId).select(
    'isDeleted verification',
  );

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }
  if (new Date() > user?.verification?.expiresAt) {
    throw new AppError(httpStatus.FORBIDDEN, 'Session has expired');
  }
  if (!user?.verification?.status) {
    throw new AppError(httpStatus.FORBIDDEN, 'OTP is not verified yet');
  }
  // if (payload?.newPassword !== payload?.confirmPassword) {
  //   throw new AppError(
  //     httpStatus.BAD_REQUEST,
  //     'New password and confirm password do not match',
  //   );
  // }

  // const hashedPassword = await bcrypt.hash(
  //   payload?.newPassword,
  //   Number(config.bcrypt_salt_rounds),
  // );

  // const result = await User.findByIdAndUpdate(decode?.userId, {
  //   password: hashedPassword,
  //   passwordChangedAt: new Date(),
  //   verification: {
  //     otp: 0,
  //     status: true,
  //   },
  // });

  // return result;


  if (payload?.newPassword !== payload?.confirmPassword) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'New password and confirm password do not match',
    );
  }

  // Directly assign the new plain text password without hashing.
  const result = await User.findByIdAndUpdate(decode?.userId, {
    password: payload.newPassword,
    passwordChangedAt: new Date(),
    verification: {
      otp: 0,
      status: true,
    },
  });

  return result;
};

// Refresh token
const refreshToken = async (token: string) => {
  // Checking if the given token is valid
  const decoded = verifyToken(token, config.jwt_refresh_secret as string);
  const { userId } = decoded;
  const user = await User.IsUserExistId(userId);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }
  const isDeleted = user?.isDeleted;

  if (isDeleted) {
    throw new AppError(httpStatus.FORBIDDEN, 'This user is deleted');
  }

  const jwtPayload: IJwtPayload = {
    userId: user?._id?.toString() as string,
    role: user.role,
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string,
  );

  return {
    accessToken,
  };
};

export const authServices = {
  login,
  changePassword,
  forgotPassword,
  resetPassword,
  refreshToken,
};
