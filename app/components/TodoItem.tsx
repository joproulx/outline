import { observer } from "mobx-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { CheckboxIcon, ClockIcon } from "outline-icons";
import { s } from "@shared/styles";
import Flex from "~/components/Flex";
import Text from "~/components/Text";
import Button from "~/components/Button";
import Input from "~/components/Input";
import { InputSelect } from "~/components/InputSelect";
import Todo from "~/models/Todo";
import useStores from "~/hooks/useStores";

type Props = {
  todo: Todo;
  isEditing?: boolean;
  onEdit: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
  onSave?: () => void;
  onCancel?: () => void;
};

const TodoItem = ({
  todo,
  isEditing = false,
  onEdit,
  onDelete,
  onSave,
  onCancel,
}: Props) => {
  const { t } = useTranslation();
  const { todos } = useStores();

  // Form state for editing mode
  const [title, setTitle] = React.useState(todo.title);
  const [description, setDescription] = React.useState(todo.description || "");
  const [priority, setPriority] = React.useState<
    "high" | "medium" | "low" | "none"
  >(todo.priority);
  const [dueDate, setDueDate] = React.useState(
    todo.dueDate ? todo.dueDate.split("T")[0] : ""
  );
  const [tags, setTags] = React.useState(todo.tags.join(", "));
  const [isLoading, setIsLoading] = React.useState(false);

  // Reset form state when editing mode changes
  React.useEffect(() => {
    if (isEditing) {
      setTitle(todo.title);
      setDescription(todo.description || "");
      setPriority(todo.priority);
      setDueDate(todo.dueDate ? todo.dueDate.split("T")[0] : "");
      setTags(todo.tags.join(", "));
    }
  }, [isEditing, todo]);

  const priorityOptions = [
    { label: "None", value: "none", type: "item" as const },
    { label: "Low", value: "low", type: "item" as const },
    { label: "Medium", value: "medium", type: "item" as const },
    { label: "High", value: "high", type: "item" as const },
  ];
  const handleToggleComplete = React.useCallback(async () => {
    if (!isEditing) {
      await todo.toggle();
    }
  }, [todo, isEditing]);

  const handleEdit = React.useCallback(() => {
    onEdit(todo);
  }, [todo, onEdit]);

  const handleDelete = React.useCallback(() => {
    onDelete(todo);
  }, [todo, onDelete]);

  const handleSave = React.useCallback(async () => {
    if (!title.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      const todoData = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate: dueDate || undefined,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      };

      await todos.update(todo, todoData);
      onSave?.();
    } catch (_error) {
      // Handle error silently for now
    } finally {
      setIsLoading(false);
    }
  }, [title, description, priority, dueDate, tags, todo, todos, onSave]);

  const handleCancel = React.useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  const priorityIcon = React.useMemo(() => {
    switch (todo.priority) {
      case "high":
        return <ClockIcon color="#e74c3c" size={14} />;
      case "medium":
        return <ClockIcon color="#f39c12" size={14} />;
      case "low":
        return <ClockIcon color="#3498db" size={14} />;
      default:
        return null;
    }
  }, [todo.priority]);

  const isValid = title.trim().length > 0;

  if (isEditing) {
    return (
      <Container
        $completed={todo.completed}
        $overdue={todo.isOverdue}
        $editing={true}
      >
        <EditForm>
          <FormField>
            <Label>{t("Title")}</Label>
            <Input
              type="text"
              value={title}
              onChange={(ev) => setTitle(ev.target.value)}
              placeholder={t("Enter todo title...")}
              required
              autoFocus
            />
          </FormField>

          <FormField>
            <Label>{t("Description")}</Label>
            <StyledTextarea
              value={description}
              onChange={(ev) => setDescription(ev.target.value)}
              placeholder={t("Add a description...")}
              rows={3}
            />
          </FormField>

          <FormRow>
            <FormField flex={1}>
              <Label>{t("Priority")}</Label>
              <InputSelect
                label="priority"
                hideLabel={true}
                options={priorityOptions}
                value={priority}
                onChange={(value) =>
                  setPriority(value as "high" | "medium" | "low" | "none")
                }
              />
            </FormField>

            <FormField flex={1}>
              <Label>{t("Due Date")}</Label>
              <DateInput
                type="date"
                value={dueDate}
                onChange={(ev) => setDueDate(ev.target.value)}
              />
            </FormField>
          </FormRow>

          <FormField>
            <Label>{t("Tags")}</Label>
            <Input
              type="text"
              value={tags}
              onChange={(ev) => setTags(ev.target.value)}
              placeholder={t("Enter tags separated by commas...")}
            />
          </FormField>

          <Actions>
            <Button type="button" onClick={handleCancel} neutral>
              {t("Cancel")}
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!isValid || isLoading}
            >
              {isLoading ? t("Saving...") : t("Update Todo")}
            </Button>
          </Actions>
        </EditForm>
      </Container>
    );
  }

  return (
    <Container $completed={todo.completed} $overdue={todo.isOverdue}>
      <Flex align="center" gap={12}>
        <CheckboxButton
          type="button"
          onClick={handleToggleComplete}
          $completed={todo.completed}
          $priority={todo.priority}
        >
          <CheckboxIcon checked={todo.completed} size={16} />
        </CheckboxButton>

        <Content>
          <Header>
            <Title $completed={todo.completed}>{todo.title}</Title>
            <Flex align="center" gap={8}>
              {priorityIcon}
              {todo.dueDate && (
                <DueDate $overdue={todo.isOverdue} $dueToday={todo.isDueToday}>
                  {todo.formattedDueDate}
                </DueDate>
              )}
            </Flex>
          </Header>

          {todo.description && (
            <Description $completed={todo.completed}>
              {todo.description}
            </Description>
          )}

          {todo.tags && todo.tags.length > 0 && (
            <Tags>
              {todo.tags.map((tag, index) => (
                <Tag key={tag}>
                  #{tag}
                  {index < todo.tags.length - 1 ? ", " : ""}
                </Tag>
              ))}
            </Tags>
          )}
        </Content>

        <Actions>
          <Button type="button" size="small" neutral onClick={handleEdit}>
            Edit
          </Button>
          <Button type="button" size="small" neutral onClick={handleDelete}>
            Delete
          </Button>
        </Actions>
      </Flex>
    </Container>
  );
};

const Container = styled.div<{
  $completed: boolean;
  $overdue: boolean;
  $editing?: boolean;
}>`
  padding: 16px;
  border: 1px solid ${s("divider")};
  border-radius: 8px;
  margin-bottom: 8px;
  background: ${(props) =>
    props.$completed ? s("backgroundSecondary") : s("background")};
  opacity: ${(props) => (props.$completed ? 0.7 : 1)};
  border-left: 4px solid
    ${(props) => {
      if (props.$editing) {
        return s("accent");
      }
      if (props.$overdue) {
        return "#e74c3c";
      }
      if (props.$completed) {
        return "#27ae60";
      }
      return s("divider");
    }};

  &:hover {
    border-color: ${s("inputBorderFocused")};
  }
`;

const CheckboxButton = styled.button<{
  $completed: boolean;
  $priority: string;
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: 2px solid
    ${(props) => {
      if (props.$completed) {
        return "#27ae60";
      }
      switch (props.$priority) {
        case "high":
          return "#e74c3c";
        case "medium":
          return "#f39c12";
        case "low":
          return "#3498db";
        default:
          return s("inputBorder");
      }
    }};
  border-radius: 4px;
  background: ${(props) => (props.$completed ? "#27ae60" : "transparent")};
  color: ${(props) => (props.$completed ? "white" : s("text"))};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${(props) =>
      props.$completed ? "#219a52" : s("inputBorderFocused")};
    background: ${(props) =>
      props.$completed ? "#219a52" : s("backgroundSecondary")};
  }
`;

const Content = styled.div`
  flex: 1;
  min-width: 0;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
`;

const Title = styled(Text).attrs({ weight: "medium" })<{ $completed: boolean }>`
  font-size: 15px;
  color: ${(props) => (props.$completed ? s("textTertiary") : s("text"))};
  text-decoration: ${(props) => (props.$completed ? "line-through" : "none")};
`;

const Description = styled(Text).attrs({ type: "secondary" })<{
  $completed: boolean;
}>`
  font-size: 13px;
  margin: 4px 0;
  color: ${(props) =>
    props.$completed ? s("textTertiary") : s("textSecondary")};
`;

const DueDate = styled(Text).attrs({ size: "xsmall" })<{
  $overdue: boolean;
  $dueToday: boolean;
}>`
  color: ${(props) => {
    if (props.$overdue) {
      return "#e74c3c";
    }
    if (props.$dueToday) {
      return "#f39c12";
    }
    return s("textTertiary");
  }};
  font-weight: ${(props) =>
    props.$overdue || props.$dueToday ? "medium" : "normal"};
`;

const Tags = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  color: ${s("textTertiary")};
  font-size: 12px;
`;

const Tag = styled.span`
  color: ${s("textSecondary")};
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s ease;

  ${Container}:hover & {
    opacity: 1;
  }
`;

const EditForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormField = styled.div<{ flex?: number }>`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: ${(props) => props.flex || 0};
`;

const FormRow = styled.div`
  display: flex;
  gap: 16px;
`;

const Label = styled(Text).attrs({ as: "label", weight: "medium" })`
  font-size: 14px;
  color: ${s("text")};
`;

const StyledTextarea = styled.textarea`
  border: 1px solid ${s("inputBorder")};
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 15px;
  color: ${s("text")};
  background: ${s("background")};
  resize: vertical;
  min-height: 80px;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: ${s("inputBorderFocused")};
  }

  &::placeholder {
    color: ${s("placeholder")};
  }
`;

const DateInput = styled.input`
  border: 1px solid ${s("inputBorder")};
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 15px;
  color: ${s("text")};
  background: ${s("background")};
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: ${s("inputBorderFocused")};
  }
`;

export default observer(TodoItem);
