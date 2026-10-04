import mongoose, { Schema } from "mongoose";

const counterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const CounterModel =
  mongoose.models.Counter || mongoose.model("Counter", counterSchema);

export async function getNextSequence(name: string) {
  const counter = await CounterModel.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq as number;
}

export default CounterModel;
