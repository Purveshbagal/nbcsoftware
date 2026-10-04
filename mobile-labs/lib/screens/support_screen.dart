import "package:flutter/material.dart";

import "../services/api_client.dart";
import "../widgets/common.dart";

/// Raise a ticket with the office and read their reply.
class SupportScreen extends StatefulWidget {
  const SupportScreen({super.key});

  @override
  State<SupportScreen> createState() => _SupportScreenState();
}

class _SupportScreenState extends State<SupportScreen> {
  final _loader = GlobalKey<LoadViewState<List<Json>>>();

  Future<void> _add() async {
    final saved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (_) => const _NewTicketSheet(),
    );
    if (saved == true) _loader.currentState?.reload();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Help & support")),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _add,
        icon: const Icon(Icons.add_comment_rounded),
        label: const Text("New ticket"),
      ),
      body: LoadView<List<Json>>(
        key: _loader,
        load: () => ApiClient.instance.list("/support"),
        builder: (context, items) {
          if (items.isEmpty) {
            return ListView(children: const [EmptyState(icon: Icons.support_agent_rounded, message: "No tickets. Need help? Raise one.")]);
          }
          return ListView.separated(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
            itemCount: items.length,
            separatorBuilder: (_, _) => const SizedBox(height: 8),
            itemBuilder: (context, i) {
              final t = items[i];
              final response = str(t["response"]);
              return RecordTile(
                title: str(t["subject"]),
                subtitle: [str(t["description"]), if (response.isNotEmpty) "Reply: $response"].where((s) => s.isNotEmpty).join("\n"),
                meta: [str(t["ticketNo"]), fmtDate(t["createdAt"]), "${t["priority"]} priority"].join(" · "),
                status: str(t["status"]),
              );
            },
          );
        },
      ),
    );
  }
}

class _NewTicketSheet extends StatefulWidget {
  const _NewTicketSheet();

  @override
  State<_NewTicketSheet> createState() => _NewTicketSheetState();
}

class _NewTicketSheetState extends State<_NewTicketSheet> {
  final _formKey = GlobalKey<FormState>();
  final _subject = TextEditingController();
  final _description = TextEditingController();
  String _priority = "medium";
  bool _saving = false;

  @override
  void dispose() {
    _subject.dispose();
    _description.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      await ApiClient.instance.post("/support", {
        "subject": _subject.text.trim(),
        "description": _description.text.trim(),
        "priority": _priority,
      });
      if (!mounted) return;
      showMessage(context, "Ticket raised.");
      Navigator.of(context).pop(true);
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(16, 0, 16, MediaQuery.of(context).viewInsets.bottom + 16),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text("New ticket", style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 16),
            TextFormField(
              controller: _subject,
              decoration: const InputDecoration(labelText: "Subject *"),
              validator: (v) => (v ?? "").trim().isEmpty ? "Enter a subject" : null,
            ),
            const SizedBox(height: 12),
            TextFormField(controller: _description, maxLines: 4, decoration: const InputDecoration(labelText: "Describe the problem")),
            const SizedBox(height: 12),
            SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: "low", label: Text("Low")),
                ButtonSegment(value: "medium", label: Text("Medium")),
                ButtonSegment(value: "high", label: Text("High")),
              ],
              selected: {_priority},
              onSelectionChanged: (s) => setState(() => _priority = s.first),
            ),
            const SizedBox(height: 16),
            BusyButton(label: "Raise ticket", busy: _saving, onPressed: _save, icon: Icons.send_rounded),
          ],
        ),
      ),
    );
  }
}
