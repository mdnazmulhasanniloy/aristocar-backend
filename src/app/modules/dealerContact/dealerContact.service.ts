import httpStatus from 'http-status';
import AppError from '../../error/AppError';
import { IdealerContact } from './dealerContact.interface';
import DealerContact from './dealerContact.models';
import { User } from '../user/user.models';
import path from 'path';
import fs from 'fs';
import { sendEmail } from '../../utils/mailSender';
import { ICar } from '../cars/cars.interface';
import { IUser } from '../user/user.interface';
import { CarModel } from '../cars/cars.models';
import QueryBuilder from '../../builder/QueryBuilder';
import { USER_ROLE } from '../user/user.constants';

const createdealerContact = async (payload: IdealerContact) => {
  //@ts-ignore

  const isCarExists: ICar | null = await CarModel.findById(
    payload?.carId,
  ).populate([{ path: 'creatorID', select: 'name email _id profile' }]);
   const carname = isCarExists?.name
  if (!isCarExists) {
    throw new AppError(httpStatus.NOT_FOUND, 'Dealer dont have this car');
  }

  const dealerContacts = await DealerContact.create({
    ...payload,
    userId: (isCarExists?.creatorID as IUser)?._id,
  });

  if (!dealerContacts) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to create contact',
    );
  }
  const emailTemplatePath = path.join(
    __dirname,
    '../../../../public/view/contact_mail.html',
  );
  const emailTemplate = fs.readFileSync(emailTemplatePath, 'utf8');

  const formattedDate = new Date().toLocaleString();
  
  const emailContent = emailTemplate
  .replace('{{firstName}}', (payload.firstName))
  .replace('{{lastName}}', (payload.lastName))
  .replace('{{email}}', (payload.email))
  .replace('{{phone}}', (payload.phone || 'N/A'))
  .replace('{{carName}}', carname || 'Unknown Car')
  .replace('{{description}}', (payload.description))
  .replace('{{date}}', formattedDate)


  await sendEmail(
    (isCarExists?.creatorID as IUser).email,
    'A new contact has been added',
    emailContent,
  );

  return dealerContacts;
};

const getAlldealerContact = async (query: Record<string, any>) => {
  const dealerContactModel = new QueryBuilder(
    DealerContact.find({}).populate('carId'),
    query,
  )
    .search(['name', 'email', 'phoneNumber', 'status'])
    .filter()
    .paginate()
    .sort();

  const data: any = await dealerContactModel.modelQuery;
  const meta = await dealerContactModel.countTotal();
  return {
    data,
    meta,
  };
};

const getdealerContactById = async (id: string) => {
  const dealercontactById = await DealerContact.findById(id);
  if (!dealercontactById) {
    throw new AppError(httpStatus.NOT_FOUND, 'Contact not found');
  }
  return dealercontactById;
};

const updatedealerContact = async (
  id: string,
  payload: Partial<IdealerContact>,
) => {
  const updateddealerContact = await DealerContact.findByIdAndUpdate(
    id,
    payload,
    {
      new: true,
      runValidators: true,
    },
  );

  if (!updateddealerContact) {
    throw new AppError(httpStatus.NOT_FOUND, 'Contact not found to update');
  }
  return updateddealerContact;
};

const deletedealerContact = async (id: string) => {
  const deleteddealerContact = await DealerContact.findByIdAndDelete(id);
  if (!deleteddealerContact) {
    throw new AppError(httpStatus.NOT_FOUND, 'Contact not found to delete');
  }
  return deleteddealerContact;
};

const getDealerContact = async (userId: string, query: Record<string, any>) => {

  const dealerContactModel = new QueryBuilder(
    DealerContact.find({ userId }).populate('carId'),
    query
  )
    .search(['name', 'email', 'phoneNumber', 'status'])
    .filter()
    .paginate()
    .sort();

  const data: any = await dealerContactModel.modelQuery;
  const meta = await dealerContactModel.countTotal();

  return {
    data,
    meta,
  };
};

export const dealerContactService = {
  createdealerContact,
  getAlldealerContact,
  getdealerContactById,
  updatedealerContact,
  deletedealerContact,
  getDealerContact,
};
