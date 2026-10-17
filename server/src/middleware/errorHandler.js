export function errorHandler(err, _req, res, _next) {
  console.error(err);
  if (err?.code === 11000) return res.status(409).json({ message: 'An account with that email already exists.' });
  const status = err.status || 500;
  res.status(status).json({ message: status === 500 ? 'Something went wrong on the server.' : err.message });
}
