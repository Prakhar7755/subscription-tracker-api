import Subscription from "../model/subscription.model.js";

export const createSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.create({
      ...req.body,
      user: req.user._id,
    });

    res.status(201).json({ success: true, data: subscription });
    // next()
  } catch (e) {
    next(e);
  }
};

export const getUserSubscription = async (req, res, next) => {
  try {
    if (req.user.id !== req.params.id) {
      const error = new Error("You are not the owner of this account");
      error.statusCode = 401;
      throw error;
    }

    const subscription = await Subscription.find({ user: req.params.id });

    res.status(200).json({ success: true, data: subscription });
  } catch (e) {
    next(e);
  }
};
