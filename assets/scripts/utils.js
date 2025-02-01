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


distanceConversion = (meters) => {
  // Distance relation units
  let text = '';
  // Nautical miles
  let nauticalMiles = meters / 1852;
  // Hull distance
  let hullDistance = meters / window.hullLength;
  // Hull distance 

  // Close (1 to 20)
  if (hullDistance < 20) {
    text = Math.round(hullDistance) + ' esloras.';
  } 
  // Mid-range (10, 15, 20, 25, 30...)
  else if (hullDistance < 50) {  
    text = Math.round(hullDistance * 2 / 10) * 10 / 2 + ' esloras.';
  } 
  // Long-range (50-100)
  else if (nauticalMiles < 0.5){
    text = Math.round(hullDistance / 10) * 10 + ' esloras.';
  }
  // Far
  else {
    let roundedNM = (Math.round(nauticalMiles * 2)) / 2;
    text = roundedNM + ' millas náuticas.'
  }

  return text;
}