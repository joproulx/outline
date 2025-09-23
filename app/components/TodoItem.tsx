import { observer } from "mobx-react";
import * as React from "react";
import styled from "styled-components";
import { CheckboxIcon, ClockIcon } from "outline-icons";
import { s } from "@shared/styles";
import Flex from "~/components/Flex";
import Text from "~/components/Text";
import Button from "~/components/Button";
import Todo from "~/models/Todo";

type Props = {
  todo: Todo;
  onEdit: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
};

const TodoItem = ({ todo, onEdit, onDelete }: Props) => {
  const handleToggleComplete = React.useCallback(async () => {
    await todo.toggle();
  }, [todo]);

  const handleEdit = React.useCallback(() => {
    onEdit(todo);
  }, [todo, onEdit]);

  const handleDelete = React.useCallback(() => {
    onDelete(todo);
  }, [todo, onDelete]);

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

const Container = styled.div<{ $completed: boolean; $overdue: boolean }>`
  padding: 16px;
  border: 1px solid ${s("divider")};
  border-radius: 8px;
  margin-bottom: 8px;
  background: ${(props) =>
    props.$completed ? s("backgroundSecondary") : s("background")};
  opacity: ${(props) => (props.$completed ? 0.7 : 1)};
  border-left: 4px solid
    ${(props) => {
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

export default observer(TodoItem);
