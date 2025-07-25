"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import Image from "next/image";

const QRCodeGenerator = ({ employee }) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!employee || !employee.employee_id) {
          throw new Error("Employee ID is required");
        }

        const qrCodeDataUrl = await QRCode.toDataURL(employee.employee_id, {
          width: 200,
          margin: 2,
        });

        setQrCodeDataUrl(qrCodeDataUrl);
      } catch (err) {
        console.error("Error generating QR code:", err);
        setError("Failed to generate QR code");
      } finally {
        setLoading(false);
      }
    };

    generateQRCode();
  }, [employee]);

  if (loading) {
    return (
      <div className="flex flex-col items-center">
        <div className="w-48 h-48 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
        <p className="mt-2 text-sm text-gray-600">Generating QR code...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center">
        <div className="w-48 h-48 flex items-center justify-center bg-gray-100 rounded">
          <p className="text-red-500 text-sm text-center px-4">{error}</p>
        </div>
        <p className="mt-2 text-sm text-gray-600">{employee.name}</p>
        <p className="text-xs text-gray-500">{employee.employee_id}</p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="bg-white p-4 rounded-lg shadow-md inline-block">
        <Image
          src={qrCodeDataUrl}
          width={30}
          height={30}
          alt={`QR Code for ${employee.firstname} ${employee.lastname}`}
          className="mx-auto"
        />
        <p className="mt-2 text-sm text-gray-600">
          {employee.firstname} {employee.lastname}
        </p>
        <p className="text-xs text-gray-500">{employee.employee_id}</p>
      </div>
      <div className="mt-4">
        <Image
          src={qrCodeDataUrl}
          width={30}
          height={30}
          alt={`QR Code for ${employee.firstname} ${employee.lastname}`}
          className="mx-auto"
          style={{ width: "100px", height: "100px" }}
        />
        <p className="mt-2 text-sm text-gray-600">
          {employee.firstname} {employee.lastname}
        </p>
      </div>
    </div>
  );
};

export default QRCodeGenerator;
