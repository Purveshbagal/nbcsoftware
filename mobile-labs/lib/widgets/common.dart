import "package:flutter/material.dart";
import "package:intl/intl.dart";

import "../app_theme.dart";
import "../services/api_client.dart";

// ---------------------------------------------------------------- formatting

final _day = DateFormat("d MMM yyyy");
final _dayShort = DateFormat("EEE, d MMM");
final _time = DateFormat("h:mm a");
final _rupees = NumberFormat.currency(locale: "en_IN", symbol: "₹", decimalDigits: 0);

DateTime? parseDate(Object? value) => value == null ? null : DateTime.tryParse(value.toString())?.toLocal();

String fmtDate(Object? value) {
  final date = parseDate(value);
  return date == null ? (value?.toString() ?? "—") : _day.format(date);
}

String fmtDayShort(Object? value) {
  final date = parseDate(value);
  return date == null ? (value?.toString() ?? "—") : _dayShort.format(date);
}

String fmtTime(Object? value) {
  final date = parseDate(value);
  return date == null ? "—" : _time.format(date);
}

String fmtRupees(num? value) => _rupees.format(value ?? 0);

String fmtDuration(int minutes) {
  final h = minutes ~/ 60;
  final m = minutes % 60;
  if (h == 0) return "${m}m";
  return "${h}h ${m.toString().padLeft(2, "0")}m";
}

/// Today as YYYY-MM-DD, in the phone's own time zone.
String todayKey() => DateFormat("yyyy-MM-dd").format(DateTime.now());

String str(Object? value) => value == null ? "" : value.toString();

// ---------------------------------------------------------------- feedback

void showMessage(BuildContext context, String message) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Text(message)));
}

void showError(BuildContext context, Object error) {
  final message = error is ApiException ? error.message : error.toString();
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Text(message), backgroundColor: AppTheme.danger));
}

// ---------------------------------------------------------------- status

class StatusChip extends StatelessWidget {
  final String status;
  const StatusChip(this.status, {super.key});

  static (Color, Color) _colors(String status) {
    switch (status.toLowerCase()) {
      case "approved":
      case "closed":
      case "done":
      case "resolved":
      case "dispatched":
      case "present":
        return (const Color(0xFFDDF5EA), const Color(0xFF0B7A55));
      case "rejected":
      case "denied":
      case "skipped":
      case "cancelled":
      case "absent":
        return (const Color(0xFFFBE3E1), AppTheme.danger);
      case "half-day":
      case "in-progress":
        return (const Color(0xFFFFF0D9), AppTheme.amber);
      default:
        return (const Color(0xFFE8E8FB), AppTheme.indigo);
    }
  }

  @override
  Widget build(BuildContext context) {
    final (bg, fg) = _colors(status);
    final label = status.isEmpty ? "—" : status[0].toUpperCase() + status.substring(1).replaceAll("-", " ");
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20)),
      child: Text(label, style: TextStyle(color: fg, fontSize: 12, fontWeight: FontWeight.w600)),
    );
  }
}

// ---------------------------------------------------------------- empty / error

class EmptyState extends StatelessWidget {
  final IconData icon;
  final String message;
  const EmptyState({super.key, required this.icon, required this.message});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 64),
      child: Column(
        children: [
          CircleAvatar(
            radius: 30,
            backgroundColor: const Color(0xFFE8E8FB),
            child: Icon(icon, color: AppTheme.indigo, size: 28),
          ),
          const SizedBox(height: 16),
          Text(message, textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodySmall?.copyWith(fontSize: 14)),
        ],
      ),
    );
  }
}

/// Loads [load], shows a spinner, an error with retry, or [builder]'s output.
/// Pull down to refresh. Call [LoadViewState.reload] through a GlobalKey to
/// refresh after a create.
class LoadView<T> extends StatefulWidget {
  final Future<T> Function() load;
  final Widget Function(BuildContext context, T data) builder;
  const LoadView({super.key, required this.load, required this.builder});

  @override
  State<LoadView<T>> createState() => LoadViewState<T>();
}

class LoadViewState<T> extends State<LoadView<T>> {
  late Future<T> _future = widget.load();

  Future<void> reload() async {
    final next = widget.load();
    setState(() => _future = next);
    try {
      await next;
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<T>(
      future: _future,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasError) {
          final error = snapshot.error;
          return RefreshIndicator(
            onRefresh: reload,
            child: ListView(
              children: [
                const SizedBox(height: 80),
                const Icon(Icons.cloud_off_rounded, size: 48, color: AppTheme.muted),
                const SizedBox(height: 12),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 32),
                  child: Text(
                    error is ApiException ? error.message : "Could not load. Pull down to try again.",
                    textAlign: TextAlign.center,
                  ),
                ),
                const SizedBox(height: 16),
                Center(child: OutlinedButton(onPressed: reload, child: const Text("Try again"))),
              ],
            ),
          );
        }
        return RefreshIndicator(onRefresh: reload, child: widget.builder(context, snapshot.data as T));
      },
    );
  }
}

// ---------------------------------------------------------------- list rows

class RecordTile extends StatelessWidget {
  final String title;
  final String? subtitle;
  final String? meta;
  final String? status;
  final Widget? leading;
  final VoidCallback? onTap;
  const RecordTile({super.key, required this.title, this.subtitle, this.meta, this.status, this.leading, this.onTap});

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (leading != null) ...[leading!, const SizedBox(width: 12)],
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: textTheme.titleMedium),
                    if (subtitle != null && subtitle!.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(subtitle!, style: textTheme.bodyMedium),
                    ],
                    if (meta != null && meta!.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(meta!, style: textTheme.bodySmall),
                    ],
                  ],
                ),
              ),
              if (status != null) ...[const SizedBox(width: 8), StatusChip(status!)],
            ],
          ),
        ),
      ),
    );
  }
}

class SectionLabel extends StatelessWidget {
  final String text;
  const SectionLabel(this.text, {super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(4, 20, 4, 8),
      child: Text(
        text.toUpperCase(),
        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, letterSpacing: 1.1, color: AppTheme.muted),
      ),
    );
  }
}

// ---------------------------------------------------------------- pickers

/// A tappable field that picks one value from a searchable list. When the
/// list is empty (masters not set up yet) the field accepts free text.
class PickerField extends StatelessWidget {
  final String label;
  final String? value;
  final List<String> options;
  final ValueChanged<String> onChanged;
  final bool required;
  final IconData icon;

  const PickerField({
    super.key,
    required this.label,
    required this.value,
    required this.options,
    required this.onChanged,
    this.required = false,
    this.icon = Icons.arrow_drop_down_rounded,
  });

  @override
  Widget build(BuildContext context) {
    if (options.isEmpty) {
      return TextFormField(
        initialValue: value,
        decoration: InputDecoration(labelText: required ? "$label *" : label),
        onChanged: onChanged,
        validator: required ? (v) => (v ?? "").trim().isEmpty ? "$label is required" : null : null,
      );
    }
    return FormField<String>(
      initialValue: value,
      validator: required ? (_) => (value ?? "").isEmpty ? "$label is required" : null : null,
      builder: (state) => InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () async {
          final picked = await pickOne(context, title: label, options: options, selected: value);
          if (picked != null) {
            onChanged(picked);
            state.didChange(picked);
          }
        },
        child: InputDecorator(
          decoration: InputDecoration(
            labelText: required ? "$label *" : label,
            suffixIcon: Icon(icon),
            errorText: state.errorText,
          ),
          isEmpty: (value ?? "").isEmpty,
          child: Text(value ?? ""),
        ),
      ),
    );
  }
}

/// Picks several values; shown as chips.
class MultiPickerField extends StatelessWidget {
  final String label;
  final List<String> values;
  final List<String> options;
  final ValueChanged<List<String>> onChanged;

  const MultiPickerField({super.key, required this.label, required this.values, required this.options, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: () async {
        final picked = await pickMany(context, title: label, options: options, selected: values);
        if (picked != null) onChanged(picked);
      },
      child: InputDecorator(
        decoration: InputDecoration(labelText: label, suffixIcon: const Icon(Icons.add_rounded)),
        isEmpty: values.isEmpty,
        child: values.isEmpty
            ? const SizedBox(height: 20)
            : Wrap(
                spacing: 6,
                runSpacing: 6,
                children: [
                  for (final v in values)
                    Chip(
                      label: Text(v),
                      visualDensity: VisualDensity.compact,
                      onDeleted: () => onChanged([...values]..remove(v)),
                    ),
                ],
              ),
      ),
    );
  }
}

Future<String?> pickOne(BuildContext context, {required String title, required List<String> options, String? selected}) {
  return showModalBottomSheet<String>(
    context: context,
    isScrollControlled: true,
    builder: (context) => _PickerSheet(title: title, options: options, selected: {?selected}, multi: false),
  ).then((value) => value);
}

Future<List<String>?> pickMany(BuildContext context, {required String title, required List<String> options, required List<String> selected}) async {
  final result = await showModalBottomSheet<Object>(
    context: context,
    isScrollControlled: true,
    builder: (context) => _PickerSheet(title: title, options: options, selected: selected.toSet(), multi: true),
  );
  return result is List<String> ? result : null;
}

class _PickerSheet extends StatefulWidget {
  final String title;
  final List<String> options;
  final Set<String> selected;
  final bool multi;
  const _PickerSheet({required this.title, required this.options, required this.selected, required this.multi});

  @override
  State<_PickerSheet> createState() => _PickerSheetState();
}

class _PickerSheetState extends State<_PickerSheet> {
  String _query = "";
  late final Set<String> _selected = {...widget.selected};

  @override
  Widget build(BuildContext context) {
    final needle = _query.toLowerCase();
    final options = widget.options.where((o) => o.toLowerCase().contains(needle)).toList();
    return SafeArea(
      child: SizedBox(
        height: MediaQuery.of(context).size.height * 0.75,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
              child: Row(
                children: [
                  Expanded(child: Text(widget.title, style: Theme.of(context).textTheme.titleLarge)),
                  if (widget.multi)
                    FilledButton(
                      onPressed: () => Navigator.pop(context, _selected.toList()),
                      child: Text("Done (${_selected.length})"),
                    ),
                ],
              ),
            ),
            if (widget.options.length > 6)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                child: TextField(
                  autofocus: false,
                  decoration: const InputDecoration(hintText: "Search", prefixIcon: Icon(Icons.search_rounded)),
                  onChanged: (v) => setState(() => _query = v),
                ),
              ),
            Expanded(
              child: options.isEmpty
                  ? const Center(child: Text("No match"))
                  : ListView.builder(
                      itemCount: options.length,
                      itemBuilder: (context, index) {
                        final option = options[index];
                        final checked = _selected.contains(option);
                        if (widget.multi) {
                          return CheckboxListTile(
                            value: checked,
                            title: Text(option),
                            onChanged: (v) => setState(() => v == true ? _selected.add(option) : _selected.remove(option)),
                          );
                        }
                        return ListTile(
                          title: Text(option),
                          trailing: checked ? const Icon(Icons.check_rounded, color: AppTheme.indigo) : null,
                          onTap: () => Navigator.pop(context, option),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Date field backed by YYYY-MM-DD strings.
class DateField extends StatelessWidget {
  final String label;
  final String value;
  final ValueChanged<String> onChanged;
  final DateTime? firstDate;
  final DateTime? lastDate;
  const DateField({super.key, required this.label, required this.value, required this.onChanged, this.firstDate, this.lastDate});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: () async {
        final current = DateTime.tryParse(value) ?? DateTime.now();
        final picked = await showDatePicker(
          context: context,
          initialDate: current,
          firstDate: firstDate ?? DateTime(2020),
          lastDate: lastDate ?? DateTime(2035),
        );
        if (picked != null) onChanged(DateFormat("yyyy-MM-dd").format(picked));
      },
      child: InputDecorator(
        decoration: InputDecoration(labelText: label, suffixIcon: const Icon(Icons.calendar_today_rounded, size: 20)),
        child: Text(value.isEmpty ? "" : fmtDate(value)),
      ),
    );
  }
}

/// A full-width primary button with a busy spinner.
class BusyButton extends StatelessWidget {
  final String label;
  final bool busy;
  final VoidCallback? onPressed;
  final IconData? icon;
  const BusyButton({super.key, required this.label, required this.busy, required this.onPressed, this.icon});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: FilledButton.icon(
        onPressed: busy ? null : onPressed,
        icon: busy
            ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
            : Icon(icon ?? Icons.check_rounded),
        label: Text(label),
      ),
    );
  }
}
