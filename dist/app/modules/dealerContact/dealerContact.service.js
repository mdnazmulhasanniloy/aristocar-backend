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
exports.dealerContactService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../error/AppError"));
const dealerContact_models_1 = __importDefault(require("./dealerContact.models"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const mailSender_1 = require("../../utils/mailSender");
const cars_models_1 = require("../cars/cars.models");
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const createdealerContact = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    var _a;
    const isCarExists = yield cars_models_1.CarModel.findById(payload === null || payload === void 0 ? void 0 : payload.carId).populate([{ path: 'creatorID', select: 'name email _id profile' }]);
    const carname = isCarExists === null || isCarExists === void 0 ? void 0 : isCarExists.name;
    if (!isCarExists) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Dealer dont have this car');
    }
    const dealerContacts = yield dealerContact_models_1.default.create(Object.assign(Object.assign({}, payload), { userId: (_a = isCarExists === null || isCarExists === void 0 ? void 0 : isCarExists.creatorID) === null || _a === void 0 ? void 0 : _a._id }));
    if (!dealerContacts) {
        throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, 'Failed to create contact');
    }
    const emailTemplatePath = path_1.default.join(__dirname, '../../../../public/view/contact_mail.html');
    const emailTemplate = fs_1.default.readFileSync(emailTemplatePath, 'utf8');
    const formattedDate = new Date().toLocaleString();
    const emailContent = emailTemplate
        .replace('{{firstName}}', (payload.firstName))
        .replace('{{lastName}}', (payload.lastName))
        .replace('{{email}}', (payload.email))
        .replace('{{phone}}', (payload.phone || 'N/A'))
        .replace('{{carName}}', carname || 'Unknown Car')
        .replace('{{description}}', (payload.description))
        .replace('{{date}}', formattedDate);
    yield (0, mailSender_1.sendEmail)((isCarExists === null || isCarExists === void 0 ? void 0 : isCarExists.creatorID).email, 'A new contact has been added', emailContent);
    return dealerContacts;
});
const getAlldealerContact = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const dealerContactModel = new QueryBuilder_1.default(dealerContact_models_1.default.find({}).populate('carId'), query)
        .search(['name', 'email', 'phoneNumber', 'status'])
        .filter()
        .paginate()
        .sort();
    const data = yield dealerContactModel.modelQuery;
    const meta = yield dealerContactModel.countTotal();
    return {
        data,
        meta,
    };
});
const getdealerContactById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const dealercontactById = yield dealerContact_models_1.default.findById(id);
    if (!dealercontactById) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Contact not found');
    }
    return dealercontactById;
});
const updatedealerContact = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const updateddealerContact = yield dealerContact_models_1.default.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });
    if (!updateddealerContact) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Contact not found to update');
    }
    return updateddealerContact;
});
const deletedealerContact = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const deleteddealerContact = yield dealerContact_models_1.default.findByIdAndDelete(id);
    if (!deleteddealerContact) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Contact not found to delete');
    }
    return deleteddealerContact;
});
const getDealerContact = (userId, query) => __awaiter(void 0, void 0, void 0, function* () {
    const dealerContactModel = new QueryBuilder_1.default(dealerContact_models_1.default.find({ userId }).populate('carId'), query)
        .search(['name', 'email', 'phoneNumber', 'status'])
        .filter()
        .paginate()
        .sort();
    const data = yield dealerContactModel.modelQuery;
    const meta = yield dealerContactModel.countTotal();
    return {
        data,
        meta,
    };
});
exports.dealerContactService = {
    createdealerContact,
    getAlldealerContact,
    getdealerContactById,
    updatedealerContact,
    deletedealerContact,
    getDealerContact,
};
