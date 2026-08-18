/* eslint-disable @typescript-eslint/no-explicit-any */
// utils/devLog.js
export const devLog = (...args: any) => {
  if (process.env.NODE_ENV === "development") {
    console.log(...args);
  }
};
