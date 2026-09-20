import { getMongoDb } from "./mongodb";

export interface ErrorReport {
  _id?: string;
  title: string;
  description: string;
  reporterEmail: string;
  reporterName: string;
  createdAt: number;
  status: "open" | "in_progress" | "resolved";
}

const COLLECTION_NAME = "dispatcher_error_reports";

export async function getErrorReportsCollection() {
  const db = await getMongoDb();
  return db.collection<ErrorReport>(COLLECTION_NAME);
}

export async function initErrorReportIndexes() {
  const collection = await getErrorReportsCollection();
  await collection.createIndex({ reporterEmail: 1, createdAt: -1 });
  await collection.createIndex({ createdAt: -1 });
}

export async function listErrorReportsForReporter(reporterEmail: string) {
  await initErrorReportIndexes();
  const reports = await (await getErrorReportsCollection())
    .find({ reporterEmail })
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();

  return reports.map((report) => ({
    ...report,
    _id: report._id?.toString(),
  }));
}

export async function createErrorReport(
  report: Omit<ErrorReport, "_id">
): Promise<ErrorReport> {
  await initErrorReportIndexes();
  const collection = await getErrorReportsCollection();
  const result = await collection.insertOne(report as any);
  return { ...report, _id: result.insertedId.toString() };
}
