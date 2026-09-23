import re

with open('app/admin/(authenticated)/subscribers/SubscribersClient.tsx', 'r') as f:
    content = f.read()

# 1. Update imports
content = content.replace(
    'import { sendNewsletterBroadcast } from "@/app/actions/newsletter";',
    'import { sendNewsletterBroadcast, adminUnsubscribeUser, adminDeleteSubscriber } from "@/app/actions/newsletter";'
)

# 2. Add states
states_injection = """  const [showConfirmBroadcast, setShowConfirmBroadcast] = useState(false);
  const [sending, setSending] = useState(false);
  
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);"""
content = content.replace(
    '  const [showConfirmBroadcast, setShowConfirmBroadcast] = useState(false);\n  const [sending, setSending] = useState(false);',
    states_injection
)

# 3. Replace handleAction and add methods
methods = """  const handleUnsubscribe = async (email: string) => {
    setOpenDropdown(null);
    if (actionPending) return;
    setActionPending(true);
    showToast(`Unsubscribing ${email}...`, "info");
    
    try {
      const res = await adminUnsubscribeUser(email);
      if (res.success) {
        showToast(res.message || "Unsubscribed successfully.", "success", "premium");
        router.refresh();
      } else {
        showToast(res.error || "Failed to unsubscribe.", "error", "premium");
      }
    } catch (e: any) {
      showToast("An error occurred.", "error", "premium");
    } finally {
      setActionPending(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || actionPending) return;
    setActionPending(true);
    
    try {
      const res = await adminDeleteSubscriber(deleteTarget);
      if (res.success) {
        showToast(res.message || "Subscriber deleted.", "success", "premium");
        setDeleteTarget(null);
        router.refresh();
      } else {
        showToast(res.error || "Failed to delete.", "error", "premium");
      }
    } catch (e: any) {
      showToast("An error occurred.", "error", "premium");
    } finally {
      setActionPending(false);
    }
  };

  const handleAction = (action: string, email: string) => {
    setOpenDropdown(null);
    if (action === "Unsubscribe") {
      handleUnsubscribe(email);
    } else if (action === "Remove") {
      setDeleteTarget(email);
    } else {
      showToast(`${action} action triggered for ${email} (Demo)`);
    }
  };"""

content = re.sub(
    r'  const handleAction = \(action: string, email: string\) => \{.*?  \};',
    methods,
    content,
    flags=re.DOTALL
)

# 4. Add ConfirmDialog
dialogs = """      <ConfirmDialog 
        isOpen={showConfirmBroadcast}
        title="Send Newsletter Broadcast"
        description={`You are about to send "${subject}" to ALL ${stats.active} active subscribers. This action will invoke the Brevo API and cannot be undone.`}
        confirmText={sending ? "Sending Broadcast..." : "Send Broadcast"}
        isDestructive={false}
        onConfirm={handleSendBroadcast}
        onCancel={() => setShowConfirmBroadcast(false)}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Subscriber"
        description={`Are you sure you want to permanently delete the subscriber ${deleteTarget}? This action cannot be undone.`}
        confirmText={actionPending ? "Deleting..." : "Delete Record"}
        isDestructive={true}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />"""

content = re.sub(
    r'      <ConfirmDialog.*?/>',
    dialogs,
    content,
    flags=re.DOTALL
)

with open('app/admin/(authenticated)/subscribers/SubscribersClient.tsx', 'w') as f:
    f.write(content)

print("SubscribersClient updated.")
