module.exports = [
"[project]/.next-internal/server/app/devpreview/page/actions.js { ACTIONS_MODULE0 => \"[project]/lib/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "0083dc0b96f6c7334fd423f6665dda7766474aa838",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["signOutAction"],
    "40d88b97bff543f32de1bbbcf0b596ac23e980f29c",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["hardResolveTicketAction"],
    "60433967db86c9ca3a57139123a49953dcf531aae9",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["replyToTicketAction"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$devpreview$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$lib$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/devpreview/page/actions.js { ACTIONS_MODULE0 => "[project]/lib/actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/actions.ts [app-rsc] (ecmascript)");
}),
"[project]/.next-internal/server/app/devpreview/page/actions.js { ACTIONS_MODULE0 => \"[project]/lib/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/actions.ts [app-rsc] (ecmascript)");
;
;
;
}),
"[project]/lib/actions.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"0083dc0b96f6c7334fd423f6665dda7766474aa838":{"name":"signOutAction"},"40d88b97bff543f32de1bbbcf0b596ac23e980f29c":{"name":"hardResolveTicketAction"},"60433967db86c9ca3a57139123a49953dcf531aae9":{"name":"replyToTicketAction"}},"lib/actions.ts",""] */ __turbopack_context__.s([
    "hardResolveTicketAction",
    ()=>hardResolveTicketAction,
    "replyToTicketAction",
    ()=>replyToTicketAction,
    "signOutAction",
    ()=>signOutAction
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$api$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next/dist/api/navigation.react-server.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/components/navigation.react-server.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/cache.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase/server.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/data.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
;
;
async function signOutAction() {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    await supabase.auth.signOut();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["redirect"])("/login");
}
async function hardResolveTicketAction(ticketId) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["redirect"])("/login");
    const advisor = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getAdvisorProfile"])(supabase, user.id);
    if (!advisor) return {
        ok: false,
        error: "Your advisor profile wasn't found."
    };
    const ticket = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getTicket"])(supabase, ticketId);
    if (!ticket || ticket.advisor_id !== advisor.id) {
        return {
            ok: false,
            error: "This ticket isn't assigned to you."
        };
    }
    try {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["resolveTicket"])(supabase, ticketId, "hard", advisor.id);
    } catch  {
        return {
            ok: false,
            error: "Couldn't record the resolution. Try again."
        };
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/dashboard");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])(`/tickets/${ticketId}`);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/tickets");
    return {
        ok: true
    };
}
async function replyToTicketAction(ticketId, body) {
    const trimmed = body.trim();
    if (!trimmed) return {
        ok: false,
        error: "Write a reply before sending."
    };
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["redirect"])("/login");
    const advisor = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getAdvisorProfile"])(supabase, user.id);
    if (!advisor) return {
        ok: false,
        error: "Your advisor profile wasn't found."
    };
    // Ownership check: RLS also blocks a cross-advisor insert, but failing
    // loudly here beats a silently no-op'd write.
    const ticket = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getTicket"])(supabase, ticketId);
    if (!ticket || ticket.advisor_id !== advisor.id) {
        return {
            ok: false,
            error: "This ticket isn't assigned to you."
        };
    }
    try {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sendTicketMessage"])(supabase, ticketId, "advisor", trimmed);
    } catch  {
        return {
            ok: false,
            error: "Couldn't send the reply. Try again."
        };
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])(`/tickets/${ticketId}`);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/dashboard");
    return {
        ok: true
    };
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    signOutAction,
    hardResolveTicketAction,
    replyToTicketAction
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(signOutAction, "0083dc0b96f6c7334fd423f6665dda7766474aa838", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(hardResolveTicketAction, "40d88b97bff543f32de1bbbcf0b596ac23e980f29c", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(replyToTicketAction, "60433967db86c9ca3a57139123a49953dcf531aae9", null);
}),
"[project]/lib/data.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getAdvisorConversations",
    ()=>getAdvisorConversations,
    "getAdvisorDarsReports",
    ()=>getAdvisorDarsReports,
    "getAdvisorProfile",
    ()=>getAdvisorProfile,
    "getAdvisorStudents",
    ()=>getAdvisorStudents,
    "getAdvisorTickets",
    ()=>getAdvisorTickets,
    "getConversation",
    ()=>getConversation,
    "getConversationMessages",
    ()=>getConversationMessages,
    "getDarsReportTree",
    ()=>getDarsReportTree,
    "getMessagesForConversations",
    ()=>getMessagesForConversations,
    "getStudentConversations",
    ()=>getStudentConversations,
    "getStudentDarsReports",
    ()=>getStudentDarsReports,
    "getTicket",
    ()=>getTicket,
    "getTicketMessages",
    ()=>getTicketMessages,
    "resolveTicket",
    ()=>resolveTicket,
    "sendTicketMessage",
    ()=>sendTicketMessage
]);
;
async function getAdvisorProfile(supabase, authUserId) {
    const { data } = await supabase.from("profiles").select("*").eq("auth_user_id", authUserId).eq("role", "advisor").maybeSingle();
    return data;
}
async function getAdvisorStudents(supabase, advisorId) {
    const { data: students } = await supabase.from("students").select("*").eq("advisor_id", advisorId);
    if (!students || students.length === 0) return [];
    const { data: profiles } = await supabase.from("profiles").select("*").in("id", students.map((s)=>s.profile_id));
    const byId = new Map((profiles ?? []).map((p)=>[
            p.id,
            p
        ]));
    return students.map((s)=>{
        const profile = byId.get(s.profile_id);
        return profile ? {
            ...s,
            profile
        } : null;
    }).filter((s)=>s !== null).sort((a, b)=>a.profile.full_name.localeCompare(b.profile.full_name));
}
async function getAdvisorTickets(supabase, advisorId) {
    const [{ data: tickets }, students] = await Promise.all([
        supabase.from("tickets").select("*").eq("advisor_id", advisorId).order("created_at", {
            ascending: true
        }),
        getAdvisorStudents(supabase, advisorId)
    ]);
    const byProfileId = new Map(students.map((s)=>[
            s.profile_id,
            s
        ]));
    return (tickets ?? []).map((t)=>({
            ...t,
            student: byProfileId.get(t.student_id) ?? null
        }));
}
async function getTicket(supabase, ticketId) {
    const { data: ticket } = await supabase.from("tickets").select("*").eq("id", ticketId).maybeSingle();
    if (!ticket) return null;
    const { data: studentRow } = await supabase.from("students").select("*").eq("profile_id", ticket.student_id).maybeSingle();
    if (!studentRow) return {
        ...ticket,
        student: null
    };
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", studentRow.profile_id).maybeSingle();
    return {
        ...ticket,
        student: profile ? {
            ...studentRow,
            profile
        } : null
    };
}
async function getTicketMessages(supabase, ticketId) {
    const { data } = await supabase.from("ticket_messages").select("*").eq("ticket_id", ticketId).order("created_at", {
        ascending: true
    });
    return data ?? [];
}
async function sendTicketMessage(supabase, ticketId, sender, body, subject = null) {
    await supabase.from("ticket_messages").insert({
        ticket_id: ticketId,
        sender,
        subject,
        body
    });
}
async function resolveTicket(supabase, ticketId, resolution, resolvedByProfileId) {
    await supabase.from("tickets").update({
        status: "resolved",
        resolution,
        resolved_by: resolvedByProfileId,
        resolved_at: new Date().toISOString()
    }).eq("id", ticketId);
}
async function getAdvisorConversations(supabase, advisorId) {
    const students = await getAdvisorStudents(supabase, advisorId);
    if (students.length === 0) return [];
    const { data: conversations } = await supabase.from("conversations").select("*").in("student_id", students.map((s)=>s.profile_id)).order("last_message_at", {
        ascending: false
    });
    const byProfileId = new Map(students.map((s)=>[
            s.profile_id,
            s
        ]));
    return (conversations ?? []).map((c)=>({
            ...c,
            student: byProfileId.get(c.student_id) ?? null
        }));
}
async function getStudentConversations(supabase, studentId) {
    const { data } = await supabase.from("conversations").select("*").eq("student_id", studentId).order("last_message_at", {
        ascending: false
    });
    return data ?? [];
}
async function getMessagesForConversations(supabase, conversationIds) {
    if (conversationIds.length === 0) return new Map();
    const { data } = await supabase.from("messages").select("*").in("conversation_id", conversationIds).order("created_at", {
        ascending: true
    });
    const byConversation = new Map();
    for (const m of data ?? []){
        const list = byConversation.get(m.conversation_id) ?? [];
        list.push(m);
        byConversation.set(m.conversation_id, list);
    }
    return byConversation;
}
async function getConversation(supabase, conversationId) {
    const { data: conversation } = await supabase.from("conversations").select("*").eq("id", conversationId).maybeSingle();
    if (!conversation) return null;
    const { data: studentRow } = await supabase.from("students").select("*").eq("profile_id", conversation.student_id).maybeSingle();
    if (!studentRow) return {
        ...conversation,
        student: null
    };
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", studentRow.profile_id).maybeSingle();
    return {
        ...conversation,
        student: profile ? {
            ...studentRow,
            profile
        } : null
    };
}
async function getConversationMessages(supabase, conversationId) {
    const { data } = await supabase.from("messages").select("*").eq("conversation_id", conversationId).order("created_at", {
        ascending: true
    });
    return data ?? [];
}
async function getAdvisorDarsReports(supabase, advisorId) {
    const students = await getAdvisorStudents(supabase, advisorId);
    if (students.length === 0) return [];
    const { data: reports } = await supabase.from("dars_reports").select("*").in("student_id", students.map((s)=>s.profile_id)).order("prepared_on", {
        ascending: false
    });
    const byProfileId = new Map(students.map((s)=>[
            s.profile_id,
            s
        ]));
    return (reports ?? []).map((r)=>({
            ...r,
            student: byProfileId.get(r.student_id) ?? null
        }));
}
async function getStudentDarsReports(supabase, studentId) {
    const { data } = await supabase.from("dars_reports").select("*").eq("student_id", studentId).order("prepared_on", {
        ascending: false
    });
    return data ?? [];
}
async function getDarsReportTree(supabase, reportId) {
    const { data: requirements } = await supabase.from("dars_requirements").select("*").eq("report_id", reportId).order("seq", {
        ascending: true
    });
    if (!requirements || requirements.length === 0) return [];
    const { data: courses } = await supabase.from("dars_courses").select("*").in("requirement_id", requirements.map((r)=>r.id));
    const coursesByReq = new Map();
    for (const c of courses ?? []){
        const list = coursesByReq.get(c.requirement_id) ?? [];
        list.push(c);
        coursesByReq.set(c.requirement_id, list);
    }
    const nodes = new Map(requirements.map((r)=>[
            r.id,
            {
                ...r,
                children: [],
                courses: coursesByReq.get(r.id) ?? []
            }
        ]));
    const roots = [];
    for (const r of requirements){
        const node = nodes.get(r.id);
        if (r.parent_id && nodes.has(r.parent_id)) {
            nodes.get(r.parent_id).children.push(node);
        } else {
            roots.push(node);
        }
    }
    return roots;
}
}),
"[project]/lib/supabase/server.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createClient",
    ()=>createClient
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/createServerClient.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/headers.js [app-rsc] (ecmascript)");
;
;
async function createClient() {
    const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cookies"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createServerClient"])(("TURBOPACK compile-time value", "https://miajqztktdzjdjxlkcgl.supabase.co"), ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pYWpxenRrdGR6amRqeGxrY2dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0NDU4NTQsImV4cCI6MjEwNDAyMTg1NH0.TJHEDUyeQRD6HPSb_e-Ce_SoaT9NP-Shw-a5pmD6U4Y"), {
        cookies: {
            getAll () {
                return cookieStore.getAll();
            },
            setAll (cookiesToSet) {
                try {
                    for (const { name, value, options } of cookiesToSet){
                        cookieStore.set(name, value, options);
                    }
                } catch  {
                // Called from a Server Component render; the proxy refreshes
                // the session instead, so writes here can be safely ignored.
                }
            }
        }
    });
}
}),
];

//# sourceMappingURL=_163bgwy._.js.map