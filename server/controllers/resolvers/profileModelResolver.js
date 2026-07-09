const ProfileModelResolver = (req, res, modelFunction) => {
  const userId = req.user && (req.user._id || req.user.id);

  const payload = {
    ...req.body,
    ...req.params,
    ...(req.query && { ...req.query }),
    ...(userId && { id: userId, userId }),
  };

  return modelFunction(payload)
    .then((data) => res.json(data))
    .catch((err) => res.json(err));
};

export default ProfileModelResolver;