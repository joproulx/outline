import { observer } from "mobx-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { ClockIcon } from "outline-icons";
import { s } from "@shared/styles";
import Flex from "~/components/Flex";
import Text from "~/components/Text";
import Button from "~/components/Button";
import Input from "~/components/Input";
import { InputSelect } from "~/components/InputSelect";
import TaskAssignmentUI from "~/components/TaskAssignmentUI";
import Task from "~/models/Task";
import useStores from "~/hooks/useStores";

type Props = {
  task: Task;
  isEditing?: boolean;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onSave?: () => void;
  onCancel?: () => void;
};

const TaskItem = ({
  task,
  isEditing = false,
  onEdit,
  onDelete,
  onSave,
  onCancel,
}: Props) => {
  const { t } = useTranslation();
  const { tasks } = useStores();
  const isMountedRef = React.useRef(true);

  // Form state for editing mode
  const [title, setTitle] = React.useState(task.title);
  const [description, setDescription] = React.useState(task.description || "");
  const [priority, setPriority] = React.useState<
    "high" | "medium" | "low" | "none"
  >(task.priority);
  const [dueDate, setDueDate] = React.useState(
    task.dueDate ? task.dueDate.split("T")[0] : ""
  );
  const [tags, setTags] = React.useState(task.tags.join(", "));
  const [isLoading, setIsLoading] = React.useState(false);

  // Cleanup on unmount
  React.useEffect(
    () => () => {
      isMountedRef.current = false;
    },
    []
  );

  // Reset form state when editing mode changes
  React.useEffect(() => {
    if (isEditing) {
      setTitle(task.title);
      setDescription(task.description || "");
      setPriority(task.priority);
      setDueDate(task.dueDate ? task.dueDate.split("T")[0] : "");
      setTags(task.tags.join(", "));
    }
  }, [isEditing, task]);

  const priorityOptions = React.useMemo(
    () => [
      { label: "None", value: "none", type: "item" as const },
      { label: "Low", value: "low", type: "item" as const },
      { label: "Medium", value: "medium", type: "item" as const },
      { label: "High", value: "high", type: "item" as const },
    ],
    []
  );

  const handleEdit = React.useCallback(() => {
    if (isMountedRef.current) {
      onEdit(task);
    }
  }, [task, onEdit]);

  const handleDelete = React.useCallback(() => {
    if (isMountedRef.current) {
      onDelete(task);
    }
  }, [task, onDelete]);

  const handleSave = React.useCallback(async () => {
    if (!title.trim() || !isMountedRef.current) {
      return;
    }

    setIsLoading(true);
    try {
      const taskData = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate: dueDate || undefined,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      };

      await tasks.update(task, taskData);
      if (isMountedRef.current) {
        onSave?.();
      }
    } catch (_error) {
      // Handle error silently for now
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [title, description, priority, dueDate, tags, task, tasks, onSave]);

  const handleCancel = React.useCallback(() => {
    if (isMountedRef.current) {
      onCancel?.();
    }
  }, [onCancel]);

  const priorityIcon = React.useMemo(() => {
    switch (task.priority) {
      case "high":
        return <ClockIcon color="#e74c3c" size={14} />;
      case "medium":
        return <ClockIcon color="#f39c12" size={14} />;
      case "low":
        return <ClockIcon color="#3498db" size={14} />;
      default:
        return null;
    }
  }, [task.priority]);

  const isValid = title.trim().length > 0;

  if (isEditing) {
    return (
      <Container $overdue={task.isOverdue} $editing={true}>
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

          <FormField>
            <Label>{t("Assignment")}</Label>
            <TaskAssignmentUI task={task} compact={false} showControls={true} />
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
    <Container $overdue={task.isOverdue}>
      <Flex align="center" gap={12}>
        <Content>
          <Header>
            <Title>{task.title}</Title>
            <Flex align="center" gap={8}>
              {priorityIcon}
              {task.dueDate && (
                <DueDate $overdue={task.isOverdue} $dueToday={task.isDueToday}>
                  {task.formattedDueDate}
                </DueDate>
              )}
            </Flex>
          </Header>

          {task.description && <Description>{task.description}</Description>}

          {task.tags && task.tags.length > 0 && (
            <Tags>
              {task.tags.map((tag, index) => (
                <Tag key={tag}>
                  #{tag}
                  {index < task.tags.length - 1 ? ", " : ""}
                </Tag>
              ))}
            </Tags>
          )}

          <AssignmentSection>
            <TaskAssignmentUI task={task} compact={true} showControls={false} />
          </AssignmentSection>
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
  $overdue: boolean;
  $editing?: boolean;
}>`
  padding: 16px;
  border: 1px solid ${s("divider")};
  border-radius: 8px;
  margin-bottom: 8px;
  background: ${s("background")};
  border-left: 4px solid
    ${(props) => {
      if (props.$editing) {
        return s("accent");
      }
      if (props.$overdue) {
        return "#e74c3c";
      }
      return s("divider");
    }};

  &:hover {
    border-color: ${s("inputBorderFocused")};
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

const Title = styled(Text).attrs({ weight: "medium" })`
  font-size: 15px;
  color: ${s("text")};
`;

const Description = styled(Text).attrs({ type: "secondary" })`
  font-size: 13px;
  margin: 4px 0;
  color: ${s("textSecondary")};
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

const AssignmentSection = styled.div`
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid ${s("divider")};
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

export default observer(TaskItem);
