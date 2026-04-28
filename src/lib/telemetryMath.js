function normalizeLongitudeDelta(delta) {
  return ((((delta + 180) % 360) + 360) % 360) - 180;
}

function toRadians(value) {
  return value * (Math.PI / 180);
}

export function calculateHeading(
  previousLatitude,
  previousLongitude,
  nextLatitude,
  nextLongitude
) {
  const previousLatitudeRadians = toRadians(previousLatitude);
  const nextLatitudeRadians = toRadians(nextLatitude);
  const longitudeDelta = toRadians(
    normalizeLongitudeDelta(nextLongitude - previousLongitude)
  );

  const y = Math.sin(longitudeDelta) * Math.cos(nextLatitudeRadians);
  const x =
    Math.cos(previousLatitudeRadians) * Math.sin(nextLatitudeRadians) -
    Math.sin(previousLatitudeRadians) *
      Math.cos(nextLatitudeRadians) *
      Math.cos(longitudeDelta);

  return (Math.atan2(y, x) * 180) / Math.PI;
}
