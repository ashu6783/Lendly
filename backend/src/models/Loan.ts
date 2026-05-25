import mongoose, { Document, Schema, Model, Types } from 'mongoose';
import { LoanStatus, EmploymentMode } from '../types';

export interface IPersonalDetails {
  fullName: string;
  pan: string;
  dateOfBirth: Date;
  monthlySalary: number;
  employmentMode: EmploymentMode;
}

export interface ISalarySlip {
  fileName: string; // stored filename on disk
  originalName: string; // name as uploaded by the borrower
  mimeType: string;
  size: number; // bytes
}

export interface ILoan extends Document {
  borrower: Types.ObjectId;
  personalDetails: IPersonalDetails;
  salarySlip?: ISalarySlip;

  // Loan configuration (set at the apply step)
  amount?: number;
  tenureDays?: number;
  interestRate?: number;
  simpleInterest?: number;
  totalRepayment?: number;

  status: LoanStatus;
  rejectionReason?: string;
  amountPaid: number;

  // Audit trail
  appliedAt?: Date;
  sanctionedBy?: Types.ObjectId;
  sanctionedAt?: Date;
  disbursedBy?: Types.ObjectId;
  disbursedAt?: Date;
  closedAt?: Date;

  createdAt: Date;
  updatedAt: Date;

  // Virtual
  outstanding: number;
}

const personalDetailsSchema = new Schema<IPersonalDetails>(
  {
    fullName: { type: String, required: true, trim: true },
    pan: { type: String, required: true, uppercase: true, trim: true },
    dateOfBirth: { type: Date, required: true },
    monthlySalary: { type: Number, required: true, min: 0 },
    employmentMode: {
      type: String,
      enum: Object.values(EmploymentMode),
      required: true,
    },
  },
  { _id: false }
);

const salarySlipSchema = new Schema<ISalarySlip>(
  {
    fileName: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
  },
  { _id: false }
);

const loanSchema = new Schema<ILoan>(
  {
    borrower: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    personalDetails: { type: personalDetailsSchema, required: true },
    salarySlip: { type: salarySlipSchema },

    amount: { type: Number },
    tenureDays: { type: Number },
    interestRate: { type: Number },
    simpleInterest: { type: Number },
    totalRepayment: { type: Number },

    status: {
      type: String,
      enum: Object.values(LoanStatus),
      default: LoanStatus.DRAFT,
      index: true,
    },
    rejectionReason: { type: String },
    amountPaid: { type: Number, default: 0 },

    appliedAt: { type: Date },
    sanctionedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    sanctionedAt: { type: Date },
    disbursedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    disbursedAt: { type: Date },
    closedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Outstanding balance = total repayment minus what has been paid so far.
loanSchema.virtual('outstanding').get(function (this: ILoan) {
  if (this.totalRepayment == null) return 0;
  return Math.max(0, Math.round((this.totalRepayment - this.amountPaid) * 100) / 100);
});

export const Loan: Model<ILoan> =
  mongoose.models.Loan || mongoose.model<ILoan>('Loan', loanSchema);
