"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const sendEmail = (to, subject, html) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('🚀 ~ sendEmail ~ html:', to);
    const transporter = nodemailer_1.default.createTransport({
        // host: 'smtp.gmail.com', // Change this based on your AWS region
        // host: 'smtp.mail.us-east-1.awsapps.com', // Change this based on your AWS region
        host: 'email-smtp.eu-west-1.amazonaws.com', // Change this based on your AWS region
        port: 587, // Use 587 if not using SSL
        secure: false, // True for port 465, false for 587
        // port: 465, // Use 587 if not using SSL
        // secure: true, // True for port 465, false for 587
        auth: {
            // TODO: replace `user` and `pass` values from <https://forwardemail.net>
            // user: config.nodemailer_host_email,
            // pass: config.nodemailer_host_pass,
            user: 'AKIAXZ5NGO5NG3ODA7P3',
            pass: 'BAOJqzx7+eNmh7KgyH8k4dFyMnzQhBjuBLdzOWt7TExn',
        },
        tls: {
            rejectUnauthorized: false, // Required for some servers
        },
    });
    const res = yield transporter.sendMail({
        from: 'noreply@aristocar.eu', // sender address
        to, // list of receivers
        subject,
        text: '', // plain text body
        html, // html body
    });
    console.log(res);
});
exports.sendEmail = sendEmail;
