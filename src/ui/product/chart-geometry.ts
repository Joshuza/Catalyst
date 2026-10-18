/** Hold each day's balance until the next event date, then jump vertically. */
export function stepLine(
  values: readonly number[],
  x: (i: number) => number,
  y: (value: number) => number,
  reverse = false,
) {
  if (!values.length) return '';
  const coordinate = (v: number) => v.toFixed(2);
  const first = reverse ? values.length - 1 : 0;
  let path = `M${coordinate(x(first))},${coordinate(y(values[first]!))}`;
  let lastX = first;
  for (let i = 1; i < values.length; i++) {
    const current = reverse ? values.length - 1 - i : i;
    const previous = reverse ? current + 1 : current - 1;
    if (values[current] === values[previous]) continue;
    const boundary = reverse ? previous : current;
    path += ` H${coordinate(x(boundary))} V${coordinate(y(values[current]!))}`;
    lastX = boundary;
  }
  const end = reverse ? 0 : values.length - 1;
  if (lastX !== end) path += ` H${coordinate(x(end))}`;
  return path;
}
