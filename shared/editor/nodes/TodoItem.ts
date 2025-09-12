import { Token } from "markdown-it";
import { NodeSpec, Node as ProsemirrorNode, NodeType } from "prosemirror-model";
import {
  splitListItem,
  sinkListItem,
  liftListItem,
} from "prosemirror-schema-list";
import toggleCheckboxItem from "../commands/toggleCheckboxItem";
import { MarkdownSerializerState } from "../lib/markdown/serializer";
import checkboxRule from "../rules/checkboxes";
import Node from "./Node";

export default class TodoItem extends Node {
  get name() {
    return "todo_item";
  }

  get schema(): NodeSpec {
    return {
      attrs: {
        checked: {
          default: false,
        },
        title: {
          default: "",
        },
        description: {
          default: "",
        },
        expectedDate: {
          default: null,
        },
        priority: {
          default: "medium",
        },
        tags: {
          default: [],
        },
      },
      content: "block+",
      defining: true,
      draggable: true,
      parseDOM: [
        {
          tag: `li[data-type="${this.name}"]`,
          getAttrs: (dom: HTMLLIElement) => ({
            checked: dom.className.includes("checked"),
            title: dom.getAttribute("data-title") || "",
            description: dom.getAttribute("data-description") || "",
            expectedDate: dom.getAttribute("data-expected-date") || null,
            priority: dom.getAttribute("data-priority") || "medium",
            tags: dom.getAttribute("data-tags")?.split(",") || [],
          }),
        },
      ],
      toDOM: (node) => {
        const { checked, title, description, expectedDate, priority, tags } =
          node.attrs;
        const checkedStr = checked.toString();

        let checkbox;
        if (typeof document !== "undefined") {
          checkbox = document.createElement("span");
          checkbox.tabIndex = -1;
          checkbox.className = "todo-checkbox";
          checkbox.setAttribute("aria-checked", checkedStr);
          checkbox.setAttribute("role", "checkbox");
          checkbox.addEventListener("click", this.handleCheckboxClick);
        }

        // Create todo header with title and metadata
        let todoHeader;
        if (typeof document !== "undefined") {
          todoHeader = document.createElement("div");
          todoHeader.className = "todo-header";
          todoHeader.contentEditable = "false";

          // Title input
          const titleInput = document.createElement("input");
          titleInput.type = "text";
          titleInput.value = title;
          titleInput.placeholder = "Todo title...";
          titleInput.className = "todo-title";
          titleInput.addEventListener("input", this.handleTitleChange);

          // Metadata row
          const metadataRow = document.createElement("div");
          metadataRow.className = "todo-metadata";

          if (description) {
            const descSpan = document.createElement("span");
            descSpan.textContent = description;
            descSpan.className = "todo-description-preview";
            metadataRow.appendChild(descSpan);
          }

          if (expectedDate) {
            const dateSpan = document.createElement("span");
            const date = new Date(expectedDate);
            dateSpan.textContent = `Due: ${date.toLocaleDateString()}`;
            dateSpan.className = "todo-due-date";
            metadataRow.appendChild(dateSpan);
          }

          if (priority !== "medium") {
            const prioritySpan = document.createElement("span");
            prioritySpan.textContent = priority;
            prioritySpan.className = `todo-priority priority-${priority}`;
            metadataRow.appendChild(prioritySpan);
          }

          todoHeader.appendChild(titleInput);
          todoHeader.appendChild(metadataRow);
        }

        return [
          "li",
          {
            "data-type": this.name,
            "data-title": title,
            "data-description": description,
            "data-expected-date": expectedDate,
            "data-priority": priority,
            "data-tags": tags.join(","),
            class: checked ? "checked todo-item" : "todo-item",
          },
          [
            "div",
            { class: "todo-item-header", contentEditable: "false" },
            ...(checkbox
              ? [checkbox]
              : [
                  [
                    "span",
                    { class: "todo-checkbox", "aria-checked": checkedStr },
                  ],
                ]),
            ...(todoHeader ? [todoHeader] : []),
          ],
          ["div", { class: "todo-item-content" }, 0],
        ];
      },
    };
  }

  get rulePlugins() {
    return [checkboxRule];
  }

  handleCheckboxClick = (event: Event) => {
    if (!(event.target instanceof HTMLSpanElement)) {
      return;
    }

    const { view } = this.editor;
    const { tr } = view.state;
    const { top, left } = event.target.getBoundingClientRect();
    const result = view.posAtCoords({ top, left });

    if (result) {
      const transaction = tr.setNodeMarkup(result.inside, undefined, {
        ...view.state.doc.nodeAt(result.inside)?.attrs,
        checked: event.target.getAttribute("aria-checked") !== "true",
      });
      view.dispatch(transaction);
    }
  };

  handleTitleChange = (event: Event) => {
    if (!(event.target instanceof HTMLInputElement)) {
      return;
    }

    const { view } = this.editor;
    const { tr } = view.state;
    const { top, left } = event.target.getBoundingClientRect();
    const result = view.posAtCoords({ top, left });

    if (result) {
      const node = view.state.doc.nodeAt(result.inside);
      if (node) {
        const transaction = tr.setNodeMarkup(result.inside, undefined, {
          ...node.attrs,
          title: event.target.value,
        });
        view.dispatch(transaction);
      }
    }
  };

  commands({ type }: { type: NodeType }) {
    return {
      indentTodoList: () => sinkListItem(type),
      outdentTodoList: () => liftListItem(type),
    };
  }

  keys({ type }: { type: NodeType }) {
    return {
      Enter: splitListItem(type, {
        checked: false,
        title: "",
        description: "",
        expectedDate: null,
        priority: "medium",
        tags: [],
      }),
      Tab: sinkListItem(type),
      "Mod-Enter": toggleCheckboxItem(),
      "Shift-Tab": liftListItem(type),
      "Mod-]": sinkListItem(type),
      "Mod-[": liftListItem(type),
    };
  }

  toMarkdown(state: MarkdownSerializerState, node: ProsemirrorNode) {
    const { checked, title, description, expectedDate, priority, tags } =
      node.attrs;

    // Start with checkbox
    state.write(checked ? "[x] " : "[ ] ");

    // Add title
    if (title) {
      state.write(`**${title}**`);
    }

    // Add metadata as comment (won't be visible but will be preserved)
    const metadata = JSON.stringify({
      description,
      expectedDate,
      priority,
      tags,
    });
    state.write(`<!-- todo-meta:${metadata} -->`);

    if (title) {
      state.write("\n");
    }

    state.renderContent(node);
  }

  parseMarkdown() {
    return {
      block: "todo_item",
      getAttrs: (tok: Token) => {
        const checked = tok.attrGet("checked") ? true : undefined;

        // Try to parse metadata from HTML comment
        let title = "";
        let description = "";
        let expectedDate = null;
        let priority = "medium";
        let tags = [];

        // Look for todo metadata in token content
        if (tok.content) {
          const metaMatch = tok.content.match(/<!-- todo-meta:(.*?) -->/);
          if (metaMatch) {
            try {
              const metadata = JSON.parse(metaMatch[1]);
              description = metadata.description || "";
              expectedDate = metadata.expectedDate || null;
              priority = metadata.priority || "medium";
              tags = metadata.tags || [];
            } catch (_) {
              // Ignore parsing errors
            }
          }

          // Extract title from bold text at start
          const titleMatch = tok.content.match(/^\*\*(.*?)\*\*/);
          if (titleMatch) {
            title = titleMatch[1];
          }
        }

        return {
          checked,
          title,
          description,
          expectedDate,
          priority,
          tags,
        };
      },
    };
  }
}
