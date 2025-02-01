// Define clock range
degreesToClockNumber = (degrees) => {
  // Divide by 30 to get the hour
  let clockNumber = Math.round(degrees / 30);
  // Adjust to 1–12 range (0 becomes 12)
  if (clockNumber === 0) {
    clockNumber = 12;
  }
  return clockNumber;
}