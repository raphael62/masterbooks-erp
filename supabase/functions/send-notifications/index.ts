/// <reference path="../deno.d.ts" />
import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "*",
      },
    });
  }

  try {
    const body = await req.json();
    const { alert_type } = body;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch notification settings for this alert type
    const { data: settings, error: settingsError } = await supabase
      .from("notification_settings")
      .select("*")
      .eq("alert_type", alert_type)
      .eq("is_enabled", true)
      .maybeSingle();

    if (settingsError) throw settingsError;
    if (!settings || !settings.recipient_emails?.length) {
      return new Response(
        JSON.stringify({ message: "Notifications disabled or no recipients configured" }),
        { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    const recipients: string[] = settings.recipient_emails;
    let emailsSent = 0;

    if (alert_type === "low_stock") {
      const threshold = settings.low_stock_threshold ?? 10;
      // Get products where stock on hand is below reorder level
      const { data: stockLevels } = await supabase
        .from("products")
        .select("product_name, reorder_level")
        .gt("reorder_level", 0);

      const lowStockItems = (stockLevels ?? []).filter(
        (p: any) => p.reorder_level <= threshold
      );

      if (lowStockItems.length > 0) {
        const rows = lowStockItems
          .map(
            (p: any) =>
              `<tr style="border-bottom:1px solid #eee">
                <td style="padding:8px 12px">${p.product_name}</td>
                <td style="padding:8px 12px;text-align:center;color:#dc2626">${p.reorder_level}</td>
              </tr>`
          )
          .join("");

        const html = `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
            <div style="background:#dc2626;color:#fff;padding:20px 24px;border-radius:8px 8px 0 0">
              <h2 style="margin:0">⚠️ Low Stock Alert</h2>
              <p style="margin:4px 0 0">The following products are at or below the reorder threshold (${threshold} units)</p>
            </div>
            <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;padding:24px">
              <table style="width:100%;border-collapse:collapse">
                <thead>
                  <tr style="background:#f9fafb">
                    <th style="padding:8px 12px;text-align:left;font-size:13px;color:#6b7280">Product Name</th>
                    <th style="padding:8px 12px;text-align:center;font-size:13px;color:#6b7280">Reorder Level</th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>
              <p style="margin-top:20px;font-size:13px;color:#6b7280">Please review inventory and place replenishment orders as needed.</p>
            </div>
          </div>`;

        for (const to of recipients) {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "onboarding@resend.dev",
              to,
              subject: `Low Stock Alert — ${lowStockItems.length} product(s) need attention`,
              html,
            }),
          });
          emailsSent++;
        }
      }
    } else if (alert_type === "tax_compliance") {
      const daysAhead = settings.threshold_days ?? 7;
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + daysAhead);

      const { data: taxRates } = await supabase
        .from("tax_rates")
        .select("tax_name, tax_type, rate_percent, effective_date, status")
        .eq("status", "Active")
        .not("effective_date", "is", null)
        .lte("effective_date", futureDate.toISOString().split("T")[0])
        .gte("effective_date", today.toISOString().split("T")[0]);

      if ((taxRates ?? []).length > 0) {
        const rows = (taxRates ?? [])
          .map(
            (t: any) =>
              `<tr style="border-bottom:1px solid #eee">
                <td style="padding:8px 12px">${t.tax_name}</td>
                <td style="padding:8px 12px">${t.tax_type}</td>
                <td style="padding:8px 12px;text-align:center">${t.rate_percent}%</td>
                <td style="padding:8px 12px;text-align:center">${t.effective_date}</td>
              </tr>`
          )
          .join("");

        const html = `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
            <div style="background:#d97706;color:#fff;padding:20px 24px;border-radius:8px 8px 0 0">
              <h2 style="margin:0">📅 Tax Compliance Reminder</h2>
              <p style="margin:4px 0 0">Tax rates with upcoming effective dates within the next ${daysAhead} days</p>
            </div>
            <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;padding:24px">
              <table style="width:100%;border-collapse:collapse">
                <thead>
                  <tr style="background:#f9fafb">
                    <th style="padding:8px 12px;text-align:left;font-size:13px;color:#6b7280">Tax Name</th>
                    <th style="padding:8px 12px;text-align:left;font-size:13px;color:#6b7280">Type</th>
                    <th style="padding:8px 12px;text-align:center;font-size:13px;color:#6b7280">Rate</th>
                    <th style="padding:8px 12px;text-align:center;font-size:13px;color:#6b7280">Effective Date</th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>
              <p style="margin-top:20px;font-size:13px;color:#6b7280">Please ensure all compliance requirements are met before the effective date.</p>
            </div>
          </div>`;

        for (const to of recipients) {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "onboarding@resend.dev",
              to,
              subject: `Tax Compliance Reminder — ${taxRates!.length} rate(s) effective within ${daysAhead} days`,
              html,
            }),
          });
          emailsSent++;
        }
      }
    } else if (alert_type === "audit_log") {
      // Fetch sensitive audit events from last 24 hours
      const since = new Date();
      since.setHours(since.getHours() - 24);

      const { data: auditLogs } = await supabase
        .from("audit_logs")
        .select("user_email, action, table_name, record_id, old_data, new_data, created_at")
        .gte("created_at", since.toISOString())
        .or("action.eq.DELETE,table_name.eq.roles,table_name.eq.role_permissions")
        .order("created_at", { ascending: false })
        .limit(50);

      if ((auditLogs ?? []).length > 0) {
        const rows = (auditLogs ?? [])
          .map((log: any) => {
            const ts = new Date(log.created_at).toLocaleString("en-GB");
            const before = log.old_data ? JSON.stringify(log.old_data).substring(0, 80) + "..." : "—";
            const after = log.new_data ? JSON.stringify(log.new_data).substring(0, 80) + "..." : "—";
            return `<tr style="border-bottom:1px solid #eee">
              <td style="padding:8px 12px;font-size:12px">${log.user_email ?? "System"}</td>
              <td style="padding:8px 12px;text-align:center">
                <span style="background:${log.action === "DELETE" ? "#fee2e2" : "#dbeafe"};color:${log.action === "DELETE" ? "#dc2626" : "#2563eb"};padding:2px 8px;border-radius:4px;font-size:11px">${log.action}</span>
              </td>
              <td style="padding:8px 12px;font-size:12px">${log.table_name}</td>
              <td style="padding:8px 12px;font-size:11px;color:#6b7280">${ts}</td>
              <td style="padding:8px 12px;font-size:11px;color:#6b7280;max-width:120px;overflow:hidden">${before}</td>
              <td style="padding:8px 12px;font-size:11px;color:#6b7280;max-width:120px;overflow:hidden">${after}</td>
            </tr>`;
          })
          .join("");

        const html = `
          <div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto">
            <div style="background:#7c3aed;color:#fff;padding:20px 24px;border-radius:8px 8px 0 0">
              <h2 style="margin:0">🔍 Audit Log Alert</h2>
              <p style="margin:4px 0 0">${auditLogs!.length} sensitive event(s) detected in the last 24 hours</p>
            </div>
            <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;padding:24px;overflow-x:auto">
              <table style="width:100%;border-collapse:collapse;min-width:600px">
                <thead>
                  <tr style="background:#f9fafb">
                    <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b7280">User</th>
                    <th style="padding:8px 12px;text-align:center;font-size:12px;color:#6b7280">Action</th>
                    <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b7280">Table</th>
                    <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b7280">Timestamp</th>
                    <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b7280">Before</th>
                    <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b7280">After</th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>
              <p style="margin-top:20px;font-size:13px;color:#6b7280">Review these changes in the Audit Log for full details.</p>
            </div>
          </div>`;

        for (const to of recipients) {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "onboarding@resend.dev",
              to,
              subject: `Audit Alert — ${auditLogs!.length} sensitive event(s) in last 24h`,
              html,
            }),
          });
          emailsSent++;
        }
      }
    } else if (alert_type === "payment_overdue") {
      const today = new Date().toISOString().split("T")[0];

      const { data: overdueInvoices } = await supabase
        .from("purchase_invoices")
        .select("invoice_no, supplier_name, subtotal, total_tax_amt, due_date, payment_date, status")
        .lt("due_date", today)
        .is("payment_date", null)
        .neq("status", "paid")
        .order("due_date", { ascending: true })
        .limit(50);

      if ((overdueInvoices ?? []).length > 0) {
        const rows = (overdueInvoices ?? [])
          .map((inv: any) => {
            const dueDate = new Date(inv.due_date);
            const daysOverdue = Math.floor((Date.now() - dueDate.getTime()) / 86400000);
            const totalAmt = (parseFloat(inv.subtotal ?? 0) + parseFloat(inv.total_tax_amt ?? 0)).toFixed(2);
            return `<tr style="border-bottom:1px solid #eee">
              <td style="padding:8px 12px">${inv.supplier_name ?? "—"}</td>
              <td style="padding:8px 12px">${inv.invoice_no}</td>
              <td style="padding:8px 12px;text-align:right">GHS ${totalAmt}</td>
              <td style="padding:8px 12px;text-align:center">${inv.due_date}</td>
              <td style="padding:8px 12px;text-align:center;color:#dc2626;font-weight:600">${daysOverdue} day(s)</td>
            </tr>`;
          })
          .join("");

        const html = `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
            <div style="background:#dc2626;color:#fff;padding:20px 24px;border-radius:8px 8px 0 0">
              <h2 style="margin:0">💳 Payment Overdue Alert</h2>
              <p style="margin:4px 0 0">${overdueInvoices!.length} purchase invoice(s) are past their due date</p>
            </div>
            <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;padding:24px">
              <table style="width:100%;border-collapse:collapse">
                <thead>
                  <tr style="background:#f9fafb">
                    <th style="padding:8px 12px;text-align:left;font-size:13px;color:#6b7280">Supplier</th>
                    <th style="padding:8px 12px;text-align:left;font-size:13px;color:#6b7280">Invoice No</th>
                    <th style="padding:8px 12px;text-align:right;font-size:13px;color:#6b7280">Amount Due</th>
                    <th style="padding:8px 12px;text-align:center;font-size:13px;color:#6b7280">Due Date</th>
                    <th style="padding:8px 12px;text-align:center;font-size:13px;color:#6b7280">Days Overdue</th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>
              <p style="margin-top:20px;font-size:13px;color:#6b7280">Please process these payments immediately to avoid supplier relationship issues.</p>
            </div>
          </div>`;

        for (const to of recipients) {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "onboarding@resend.dev",
              to,
              subject: `Payment Overdue — ${overdueInvoices!.length} invoice(s) require immediate attention`,
              html,
            }),
          });
          emailsSent++;
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, emails_sent: emailsSent }),
      { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  }
});
