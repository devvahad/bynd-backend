const ModelResolver = (req, res, modelFunction) => {
  const payload = {
    ...req.body,
    ...req.params,
    ...(req.user && { id: req.user._id || req.user.id }),
  };

  return modelFunction(payload)
  .then((data) => res.status(data.httpStatus ?? 200).json(data))
  .catch((err) => res.status(err.httpStatus ?? 500).json(err));
};

export default ModelResolver;