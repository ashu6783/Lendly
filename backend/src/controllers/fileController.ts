import path from 'path';
import fs from 'fs';
import { Request, Response } from 'express';
import { Loan } from '../models/Loan';
import { ApiError, asyncHandler } from '../utils/ApiError';
import { Role } from '../types';
import { UPLOAD_DIR } from '../middleware/upload';

/**
 * GET /api/files/salary-slip/:loanId
 * Streams the salary slip for a loan. Allowed for staff roles (Admin and any
 * executive) and for the borrower who owns the loan. Everyone else gets 403.
 */
export const getSalarySlip = asyncHandler(async (req: Request, res: Response) => {
  const loan = await Loan.findById(req.params.loanId);
  if (!loan || !loan.salarySlip) throw ApiError.notFound('Salary slip not found');

  const user = req.user!;
  const isOwner = String(loan.borrower) === user.id;
  const isStaff = [
    Role.Admin,
    Role.Sales,
    Role.Sanction,
    Role.Disbursement,
    Role.Collection,
  ].includes(user.role);

  if (!isOwner && !isStaff) throw ApiError.forbidden();

  const filePath = path.join(UPLOAD_DIR, loan.salarySlip.fileName);
  if (!fs.existsSync(filePath)) throw ApiError.notFound('File missing on server');

  res.setHeader('Content-Type', loan.salarySlip.mimeType);
  res.setHeader(
    'Content-Disposition',
    `inline; filename="${loan.salarySlip.originalName}"`
  );
  fs.createReadStream(filePath).pipe(res);
});
