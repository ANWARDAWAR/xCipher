export function handleServerError(error: unknown, defaultMessage = "An unexpected error occurred.") {
  if (error instanceof Error) {
    console.error(`>>> [SERVER ERROR] ${error.message}\n${error.stack}`);
  } else {
    console.error(">>> [SERVER ERROR]", error);
  }
  return { success: false as const, error: defaultMessage };
}
