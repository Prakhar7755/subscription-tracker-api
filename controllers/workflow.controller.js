import { serve } from "@upstash/workflow/express";
import dayjs from "dayjs";
import Subscription from "../model/subscription.model.js";

const REMINDERS = [7, 5, 2, 1];

export const sendReminder = serve(async (context) => {
  const { subscriptionId } = context.requestPayload;

  const subscription = await fetchSubscription(
    context,
    subscriptionId
  );

  if (!subscription || subscription.status !== "active") {
    return;
  }

  const reminderSchedule = await context.run("schedule reminders", async () => {
    const renewalDate = dayjs(subscription.renewalDate);

    if (!renewalDate.isValid()) {
      throw new Error(`Invalid renewal date for subscription ${subscriptionId}`);
    }

    const now = dayjs();
    if (renewalDate.isBefore(now)) {
      console.log(
        `Renewal date has passed for subscription ${subscriptionId}. Stopping workflow.`
      );
      return [];
    }

    return REMINDERS.map((daysBefore) => ({
      daysBefore,
      reminderDate: renewalDate.subtract(daysBefore, "day").toISOString(),
    })).filter(({ reminderDate }) => !dayjs(reminderDate).isBefore(now));
  });

  for (const { daysBefore, reminderDate } of reminderSchedule) {
    const label = `Reminder ${daysBefore} days before`;

    await sleepUntilReminder(context, label, reminderDate);

    await triggerReminder(context, label, subscription);
  }
});

const fetchSubscription = async (context, subscriptionId) => {
  return await context.run("get subscription", async () => {
    return await Subscription.findById(subscriptionId)
      .populate("user", "name email")
      .lean();
  });
};

const sleepUntilReminder = async (context, label, date) => {
  console.log(`Sleeping until ${label} reminder at ${date}`);

  await context.sleepUntil(label, date);
};

const triggerReminder = async (context, label, subscription) => {
  await context.run(label, async () => {
    console.log(`Triggering ${label} reminder`);

    const user = subscription.user;

    if (!user?.email) {
      console.log("User email not found. Skipping notification.");
      return;
    }

    // Send email/SMS here.
    console.log(`Sending reminder to ${user.email}`);
  });
};
