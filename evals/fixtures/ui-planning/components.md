# Synthetic component and capability catalogue

## Available data and actions

`listInvoices()` supplies invoice ID/number, customer name, due date, outstanding
amount, currency, status (draft, sent, overdue, paid), and last reminder date.
The fixture account uses one currency. The existing service supplies overdue
count and total outstanding amount. Monthly revenue data is also available.

`sendReminder(invoiceId)` emails one reminder and returns an updated last-reminder
timestamp. It can fail. Only sent/overdue invoices with an outstanding balance are
eligible. No bulk reminder endpoint or bulk operation is implemented.

## Components

| ID | Existing component and concrete candidate behavior |
| --- | --- |
| invoice_table | InvoiceTable shows the required columns, sorts by due date, and supports a per-row action slot. Required by the task. |
| overdue_filter | StatusFilter offers All and Overdue, filtering the same table. The person can return to All. |
| customer_search | SearchInput filters the same table by customer name or invoice number and can be cleared. Combines with StatusFilter. |
| revenue_chart | RevenueChart shows monthly revenue over the past year. It has no invoice follow-up action. |
| reminder_action | ReminderButton in each eligible InvoiceTable row calls sendReminder for that invoice. Supports pending, success, and error feedback. Depends on the table row and existing action. |
| bulk_reminders | BulkActionBar offers select-all-overdue and Send reminders. The visual shell exists but has no selection integration or bulk sending behavior yet. Treat that behavior as a proposed addition. |
| summary_cards | Two MetricCards show overdue count and total outstanding amount above the table, each with a large number and label. |
| summary_row | CompactSummary shows the same overdue count and outstanding amount in a single labelled row above the table. An alternative to summary_cards. |

The design system uses clear labels, a restrained palette, and a single primary
action style. Existing table patterns support accessible row actions and a
compact presentation on phones. Actual layout and interaction verification would
require an implementation; this fixture provides descriptions only.
