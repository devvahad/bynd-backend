import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const SubscriptionConfigSchema = new Schema({
  android: { type: Object },
  ios: { type: String },
});

const SubscriptionConfigModel = model('SubscriptionConfiguration', SubscriptionConfigSchema);

export default SubscriptionConfigModel;
