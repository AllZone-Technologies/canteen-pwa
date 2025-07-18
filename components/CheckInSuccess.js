import React from "react";
import styles from "../styles/CheckInSuccess.module.css";

const CheckInSuccess = ({ employeeData, entityType = "employee" }) => {
  const isContractor = entityType === "contractor";

  return (
    <div className={styles.container}>
      <div className={styles.successCard}>
        <div className={styles.iconContainer}>
          <svg
            className={styles.checkIcon}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className={styles.title}>Check-in Successful!</h1>

        {isContractor ? (
          <>
            <p className={styles.name}>{employeeData.company_name}</p>
            {employeeData.contact_person && (
              <p className={styles.contactPerson}>
                Contact: {employeeData.contact_person}
              </p>
            )}
            <p className={styles.entityType}>Contractor Company</p>
          </>
        ) : (
          <>
            <p className={styles.name}>
              {employeeData.firstname} {employeeData.lastname}
            </p>
            <p className={styles.employeeId}>ID: {employeeData.employee_id}</p>
            <p className={styles.department}>{employeeData.department}</p>
          </>
        )}

        <p className={styles.time}>
          {new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })}
        </p>
        <p className={styles.date}>
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>
    </div>
  );
};

export default CheckInSuccess;
