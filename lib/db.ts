import { getMongoDb } from "./mongodb";
import { Document } from "mongodb";

export async function getCollection<T extends Document = Document>(name: string) {
  const db = await getMongoDb();
  return db.collection<T>(name);
}
