const fs = require("fs");
const path = require("path");

const buildSwaggerSpec = require("./swaggerSpec");

const outputPath = path.join(__dirname, "postman.collection.json");

const objectIdLike = /^[a-f0-9]{24}$/i;

const staticVariables = {
  baseUrl: "http://localhost:5000",
  token: "",
  refreshToken: "",
  adminToken: "",
  adminRefreshToken: "",
  id: "67cf9b5ea7f1e1d4130d91b2",
  userId: "67cf9b5ea7f1e1d4130d91b2",
  targetUserId: "67cf9b5ea7f1e1d4130d91b3",
  participantId: "67cf9b5ea7f1e1d4130d91b3",
  recipientId: "67cf9b5ea7f1e1d4130d91b3",
  memberUserId: "67cf9b5ea7f1e1d4130d91b4",
  invitedUser: "67cf9b5ea7f1e1d4130d91b4",
  facultyId: "67cf9b5ea7f1e1d4130d91c1",
  departmentId: "67cf9b5ea7f1e1d4130d91c2",
  skillId: "67cf9b5ea7f1e1d4130d91c3",
  interestId: "67cf9b5ea7f1e1d4130d91c4",
  categoryId: "67cf9b5ea7f1e1d4130d91c5",
  projectId: "67cf9b5ea7f1e1d4130d91d1",
  applicationId: "67cf9b5ea7f1e1d4130d91d2",
  invitationId: "67cf9b5ea7f1e1d4130d91d3",
  conversationId: "67cf9b5ea7f1e1d4130d91d4",
  messageId: "67cf9b5ea7f1e1d4130d91d5",
  notificationId: "67cf9b5ea7f1e1d4130d91d6",
  taskId: "67cf9b5ea7f1e1d4130d91d7",
  commentId: "67cf9b5ea7f1e1d4130d91d8",
  reportId: "67cf9b5ea7f1e1d4130d91d9",
  settingId: "67cf9b5ea7f1e1d4130d91e0",
  contextId: "67cf9b5ea7f1e1d4130d91e1",
  fileId: "67cf9b5ea7f1e1d4130d91e2",
  filePath: "/absolute/path/to/file.png"
};

const variableNames = new Set(Object.keys(staticVariables));

const pathVariableMap = {
  id: "id",
  userId: "userId",
  projectId: "projectId",
  applicationId: "applicationId",
  invitationId: "invitationId",
  conversationId: "conversationId",
  messageId: "messageId",
  commentId: "commentId",
  reportId: "reportId",
  notificationId: "notificationId",
  taskId: "taskId"
};

const saveTokenScript = (tokenKey, refreshTokenKey, userIdKey = "userId") => ({
  listen: "test",
  script: {
    type: "text/javascript",
    exec: [
      "const json = pm.response.json();",
      "if (json?.data?.accessToken) pm.collectionVariables.set(\"" + tokenKey + "\", json.data.accessToken);",
      "if (json?.data?.refreshToken) pm.collectionVariables.set(\"" + refreshTokenKey + "\", json.data.refreshToken);",
      "if (json?.data?.user?._id) pm.collectionVariables.set(\"" + userIdKey + "\", json.data.user._id);"
    ]
  }
});

const captureDataIdScript = (variableKey, pathExpression = "json?.data?._id") => ({
  listen: "test",
  script: {
    type: "text/javascript",
    exec: [
      "const json = pm.response.json();",
      `if (${pathExpression}) pm.collectionVariables.set("${variableKey}", ${pathExpression});`
    ]
  }
});

const customEvents = {
  "POST /api/auth/register": [saveTokenScript("token", "refreshToken")],
  "POST /api/auth/login": [saveTokenScript("token", "refreshToken")],
  "POST /api/auth/admin/login": [saveTokenScript("adminToken", "adminRefreshToken", "userId")],
  "POST /api/projects": [captureDataIdScript("projectId")],
  "POST /api/projects/{id}/applications": [captureDataIdScript("applicationId")],
  "POST /api/projects/{id}/invitations": [captureDataIdScript("invitationId")],
  "POST /api/tasks": [captureDataIdScript("taskId")],
  "POST /api/chat/conversations/private": [captureDataIdScript("conversationId")],
  "POST /api/chat/messages/private": [
    captureDataIdScript("conversationId", "json?.data?.conversation?._id"),
    captureDataIdScript("messageId", "json?.data?.message?._id")
  ],
  "POST /api/chat/messages/project": [
    captureDataIdScript("conversationId", "json?.data?.conversation?._id"),
    captureDataIdScript("messageId", "json?.data?.message?._id")
  ],
  "POST /api/reports": [captureDataIdScript("reportId")],
  "POST /api/files/upload": [captureDataIdScript("contextId", "json?.data?._id")]
};

const resolveRef = (ref, spec) => {
  const parts = ref.replace(/^#\//, "").split("/");
  return parts.reduce((acc, key) => acc?.[key], spec);
};

const normalizeName = (name = "") => name.charAt(0).toLowerCase() + name.slice(1);

const inferStringExample = (schema, propName) => {
  if (schema.example !== undefined) {
    return schema.example;
  }

  if (schema.default !== undefined) {
    return schema.default;
  }

  if (schema.enum?.length) {
    return schema.enum[0];
  }

  if (schema.format === "email") {
    return "user@example.com";
  }

  if (schema.format === "uri") {
    return "https://example.com";
  }

  if (schema.format === "date-time") {
    return "2026-03-14T12:30:00.000Z";
  }

  if (schema.format === "binary") {
    return "{{filePath}}";
  }

  if (/otp/i.test(propName)) {
    return "123456";
  }

  if (/refreshToken/i.test(propName)) {
    variableNames.add("refreshToken");
    return "{{refreshToken}}";
  }

  if (/password/i.test(propName)) {
    return "Password@123";
  }

  if (/email/i.test(propName)) {
    return "user@example.com";
  }

  if (/fullName/i.test(propName)) {
    return "Ada Lovelace";
  }

  if (/content/i.test(propName)) {
    return "Hello team";
  }

  if (/roleName|proposedRole/i.test(propName)) {
    return "frontend developer";
  }

  if (/resolutionNote/i.test(propName)) {
    return "Reviewed and resolved";
  }

  if (/reason/i.test(propName)) {
    return "Detailed reason for this action";
  }

  if (/key/i.test(propName)) {
    return "maintenance_mode";
  }

  if (/phone/i.test(propName)) {
    return "+2348012345678";
  }

  if (/message|description|reason|bio/i.test(propName)) {
    return `${propName} sample`;
  }

  if (/title/i.test(propName)) {
    return "Sample title";
  }

  if (/status/i.test(propName)) {
    return "open";
  }

  return "sample";
};

const inferVariableName = (propName) => {
  if (!propName) {
    return "id";
  }

  if (propName === "invitedUser") return "invitedUser";
  if (propName === "faculty") return "facultyId";
  if (propName === "department") return "departmentId";
  if (propName === "category") return "categoryId";
  if (propName === "project") return "projectId";
  if (propName === "user") return "userId";
  if (propName === "targetId") return "targetUserId";
  if (propName === "assignedTo") return "userId";
  if (propName === "mentions") return "userId";
  if (propName === "messageIds") return "messageId";
  if (propName === "attachments") return "fileId";
  if (propName === "skills" || propName === "requiredSkills" || propName === "optionalSkills") return "skillId";
  if (propName === "interests") return "interestId";
  if (propName === "participantId") return "participantId";
  if (propName === "recipientId") return "recipientId";
  if (propName === "memberUserId") return "memberUserId";
  if (propName === "contextId") return "contextId";

  if (/Id$/i.test(propName)) {
    return propName;
  }

  if (/user/i.test(propName)) {
    return `${normalizeName(propName)}Id`;
  }

  return `${normalizeName(propName)}Id`;
};

const schemaExample = (schema, spec, propName = "") => {
  if (!schema) {
    return null;
  }

  if (schema.$ref) {
    return schemaExample(resolveRef(schema.$ref, spec), spec, propName);
  }

  if (schema.oneOf?.length) {
    return schemaExample(schema.oneOf[0], spec, propName);
  }

  if (schema.anyOf?.length) {
    return schemaExample(schema.anyOf[0], spec, propName);
  }

  if (schema.allOf?.length) {
    const pieces = schema.allOf.map((part) => schemaExample(part, spec, propName)).filter(Boolean);

    if (pieces.every((piece) => typeof piece === "object" && !Array.isArray(piece))) {
      return Object.assign({}, ...pieces);
    }

    return pieces[0] ?? null;
  }

  if (schema.example !== undefined) {
    if (typeof schema.example === "string" && objectIdLike.test(schema.example)) {
      const variableName = inferVariableName(propName);
      variableNames.add(variableName);
      return `{{${variableName}}}`;
    }

    return schema.example;
  }

  if (schema.enum?.length) {
    return schema.enum[0];
  }

  if (schema.type === "array") {
    return [schemaExample(schema.items, spec, propName)];
  }

  if (schema.type === "object" || schema.properties) {
    return Object.entries(schema.properties || {}).reduce((acc, [key, value]) => {
      acc[key] = schemaExample(value, spec, key);
      return acc;
    }, {});
  }

  if (schema.type === "integer" || schema.type === "number") {
    if (schema.default !== undefined) return schema.default;
    if (schema.minimum !== undefined) return schema.minimum;
    return schema.type === "integer" ? 1 : 0;
  }

  if (schema.type === "boolean") {
    return schema.default !== undefined ? schema.default : true;
  }

  if (schema.type === "string" || !schema.type) {
    const example = inferStringExample(schema, propName);

    if (objectIdLike.test(example)) {
      const variableName = inferVariableName(propName);
      variableNames.add(variableName);
      return `{{${variableName}}}`;
    }

    return example;
  }

  return null;
};

const toPostmanUrl = (routePath, queryParams = [], spec) => {
  const substitutedPath = routePath.replace(/\{(\w+)\}/g, (_, key) => {
    const variableName = pathVariableMap[key] || key;
    variableNames.add(variableName);
    return `{{${variableName}}}`;
  });

  return {
    raw: `{{baseUrl}}${substitutedPath}`,
    host: ["{{baseUrl}}"],
    path: substitutedPath.replace(/^\//, "").split("/"),
    query: queryParams.map((param) => ({
      key: param.name,
      value: String(schemaExample(param.schema, spec, param.name) ?? ""),
      description: param.description || ""
    }))
  };
};

const buildRequestDescription = (method, routePath, operation, authVariable, spec) => {
  const lines = [];

  if (operation.summary) {
    lines.push(operation.summary);
    lines.push("");
  }

  lines.push(`Method: \`${method}\``);
  lines.push(`Path: \`${routePath}\``);
  lines.push(`Auth: ${authVariable ? `Bearer \`{{${authVariable}}}\`` : "None"}`);

  const pathParams = (operation.parameters || []).filter((param) => param.in === "path");
  if (pathParams.length) {
    lines.push("");
    lines.push("Path parameters:");
    pathParams.forEach((param) => {
      lines.push(`- \`${param.name}\`${param.required ? " (required)" : ""}`);
    });
  }

  const queryParams = (operation.parameters || []).filter((param) => param.in === "query");
  if (queryParams.length) {
    lines.push("");
    lines.push("Query parameters:");
    queryParams.forEach((param) => {
      const sample = schemaExample(param.schema, spec, param.name);
      lines.push(`- \`${param.name}\`${param.required ? " (required)" : ""}${sample !== null ? `, sample: \`${sample}\`` : ""}`);
    });
  }

  if (operation.requestBody?.content) {
    lines.push("");
    lines.push(`Body: \`${Object.keys(operation.requestBody.content).join(", ")}\``);
  }

  return lines.join("\n");
};

const buildRequestBody = (content, spec) => {
  const contentType = Object.keys(content)[0];
  const bodySchema = content[contentType]?.schema;
  const example = schemaExample(bodySchema, spec);

  if (contentType === "multipart/form-data") {
    const formdata = Object.entries(bodySchema?.properties || {}).map(([key, value]) => {
      const resolved = value.$ref ? resolveRef(value.$ref, spec) : value;
      const isFile = resolved?.format === "binary";

      if (!isFile && typeof example?.[key] === "string" && /^\{\{.+\}\}$/.test(example[key])) {
        variableNames.add(example[key].replace(/[{}]/g, ""));
      }

      return {
        key,
        type: isFile ? "file" : "text",
        src: isFile ? "{{filePath}}" : undefined,
        value: isFile ? undefined : String(example?.[key] ?? ""),
        description: resolved?.description || ""
      };
    });

    return {
      mode: "formdata",
      formdata
    };
  }

  return {
    mode: "raw",
    raw: JSON.stringify(example, null, 2),
    options: {
      raw: {
        language: "json"
      }
    }
  };
};

const buildRequest = (method, routePath, operation, spec) => {
  const headers = [];
  const content = operation.requestBody?.content;
  const queryParams = (operation.parameters || []).filter((param) => param.in === "query");
  const isProtected = Array.isArray(operation.security) && operation.security.length > 0;
  const authVariable = !isProtected ? null : routePath.startsWith("/api/admin/") ? "adminToken" : "token";

  if (content && !content["multipart/form-data"]) {
    headers.push({
      key: "Content-Type",
      value: Object.keys(content)[0]
    });
  }

  return {
    name: operation.summary || `${method} ${routePath}`,
    event: customEvents[`${method} ${routePath}`] || undefined,
    request: {
      method,
      description: buildRequestDescription(method, routePath, operation, authVariable, spec),
      header: headers,
      auth: authVariable
        ? {
            type: "bearer",
            bearer: [{ key: "token", value: `{{${authVariable}}}`, type: "string" }]
          }
        : {
            type: "noauth"
          },
      body: content ? buildRequestBody(content, spec) : undefined,
      url: toPostmanUrl(routePath, queryParams, spec)
    },
    response: []
  };
};

const buildSocketFolder = () => ({
  name: "Socket.IO Reference",
  description: {
    type: "text/markdown",
    content: [
      "Socket.IO connects to the same origin as the REST API, without the `/api` prefix.",
      "",
      "Auth handshake:",
      "```javascript",
      "const socket = io(\"http://localhost:5000\", {",
      "  auth: { token: pm.collectionVariables.get(\"token\") }",
      "});",
      "```",
      "",
      "Implemented client events:",
      "- `join_project_room` `{ projectId }`",
      "- `leave_project_room` `{ projectId }`",
      "- `private_message` `{ recipientId, content, attachments? }`",
      "- `project_message` `{ projectId, content, attachments?, mentions? }`",
      "- `typing_start` `{ projectId? | recipientId?, conversationId? }`",
      "- `typing_stop` `{ projectId? | recipientId?, conversationId? }`",
      "- `mark_as_read` `{ conversationId, messageIds? }`",
      "- `message_edited` `{ messageId, content }`",
      "- `message_deleted` `{ messageId }`",
      "- `presence_update` `{ status }`",
      "",
      "Implemented server events:",
      "- `joined_project_room`",
      "- `left_project_room`",
      "- `private_message`",
      "- `project_message`",
      "- `typing_start`",
      "- `typing_stop`",
      "- `messages_read`",
      "- `message_edited`",
      "- `message_deleted`",
      "- `presence_update`",
      "- `notification:new`",
      "- `socket_error`"
    ].join("\n")
  },
  item: []
});

const main = () => {
  const spec = buildSwaggerSpec();
  const tagDescriptions = new Map((spec.tags || []).map((tag) => [tag.name, tag.description]));
  const folders = new Map(
    (spec.tags || []).map((tag) => [
      tag.name,
      {
        name: tag.name,
        description: {
          type: "text/markdown",
          content: tag.description || `${tag.name} endpoints`
        },
        item: []
      }
    ])
  );

  Object.entries(spec.paths).forEach(([routePath, methods]) => {
    Object.entries(methods).forEach(([method, operation]) => {
      const tag = operation.tags?.[0] || "Misc";
      if (!folders.has(tag)) {
        folders.set(tag, {
          name: tag,
          description: {
            type: "text/markdown",
            content: tagDescriptions.get(tag) || `${tag} endpoints`
          },
          item: []
        });
      }

      folders.get(tag).item.push(buildRequest(method.toUpperCase(), routePath, operation, spec));
    });
  });

  const collection = {
    info: {
      name: "Student Project Collaboration Platform API",
      _postman_id: "ca332f55-bfce-48c1-b2b6-99afbe19d6fa",
      description: [
        "Comprehensive Postman collection generated from the local OpenAPI source in `src/docs/swaggerSpec.js`.",
        "",
        "It covers the complete REST API, includes reusable collection variables, and captures common IDs/tokens from create and login flows.",
        "",
        "REST base URL: `{{baseUrl}}`",
        "",
        "Socket.IO notes are included in the `Socket.IO Reference` folder."
      ].join("\n"),
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    item: [...folders.values(), buildSocketFolder()],
    variable: Array.from(variableNames)
      .sort()
      .map((key) => ({
        key,
        value: staticVariables[key] ?? ""
      }))
  };

  fs.writeFileSync(outputPath, JSON.stringify(collection, null, 2));
  console.log(`Postman collection written to ${outputPath}`);
};

main();
