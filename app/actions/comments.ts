"use server";

// Simulated database
let commentsStore = [
  { id: "1", author: "TechInsider", date: "2 hours ago", content: "Fascinating breakdown of the architectural shifts. The implications for edge computing are particularly interesting." },
  { id: "2", author: "Sarah J.", date: "5 hours ago", content: "I wonder how this impacts existing legacy systems migrating to the cloud. Is the performance overhead worth it?" }
];

export async function getComments(articleSlug: string) {
  // Simulate delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return commentsStore;
}

export async function postComment(articleSlug: string, formData: FormData) {
  const content = formData.get("comment") as string;
  if (!content || !content.trim()) {
    return { success: false, error: "Comment cannot be empty" };
  }

  await new Promise(resolve => setTimeout(resolve, 500));

  const newComment = {
    id: Date.now().toString(),
    author: "Guest User",
    date: "Just now",
    content: content.trim()
  };

  commentsStore = [newComment, ...commentsStore];

  return { success: true, comment: newComment };
}
