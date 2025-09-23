import { observer } from "mobx-react";
import * as React from "react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { PlusIcon } from "outline-icons";
import { s } from "@shared/styles";
import Button from "~/components/Button";
import Input from "~/components/Input";
import Text from "~/components/Text";
import TodoForm from "~/components/TodoForm";
import TodoItem from "~/components/TodoItem";
import Todo from "~/models/Todo";
import useStores from "~/hooks/useStores";

const TodoList = () => {
  const { t } = useTranslation();
  const { todos } = useStores();

  const [showForm, setShowForm] = React.useState(false);
  const [editingTodo, setEditingTodo] = React.useState<Todo | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");

  useEffect(() => {
    // Load todos when component mounts
    todos.fetchPage();
  }, [todos]);

  const filteredTodos = React.useMemo(() => {
    let result = todos.all;

    // Apply search filter
    if (searchQuery) {
      result = todos.search(searchQuery);
    }

    return result.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [searchQuery, todos]);

  const handleCreateTodo = React.useCallback(() => {
    setEditingTodo(null);
    setShowForm(true);
  }, []);

  const handleEditTodo = React.useCallback((todo: Todo) => {
    setEditingTodo(todo);
    setShowForm(true);
  }, []);

  const handleDeleteTodo = React.useCallback(
    async (todo: Todo) => {
      if (window.confirm(t("Are you sure you want to delete this todo?"))) {
        await todos.delete(todo);
      }
    },
    [todos, t]
  );

  const handleSaveTodo = React.useCallback(() => {
    setShowForm(false);
    setEditingTodo(null);
  }, []);

  const handleCancelForm = React.useCallback(() => {
    setShowForm(false);
    setEditingTodo(null);
  }, []);

  const stats = todos.stats;

  return (
    <Container>
      <Header>
        <HeaderTop>
          <div>
            <Title>{t("Todos")}</Title>
            <Stats>
              {stats.active} {t("active")} • {stats.completed} {t("completed")}
              {stats.overdue > 0 && (
                <>
                  {" "}
                  •{" "}
                  <OverdueCount>
                    {stats.overdue} {t("overdue")}
                  </OverdueCount>
                </>
              )}
            </Stats>
          </div>
          <Button type="button" onClick={handleCreateTodo} icon={<PlusIcon />}>
            {t("Add Todo")}
          </Button>
        </HeaderTop>

        <Controls>
          <SearchContainer>
            <Input
              placeholder={t("Search todos...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </SearchContainer>
        </Controls>
      </Header>

      {showForm && (
        <FormContainer>
          <TodoForm
            todo={editingTodo || undefined}
            onSave={handleSaveTodo}
            onCancel={handleCancelForm}
          />
        </FormContainer>
      )}

      <Content>
        {filteredTodos.length === 0 ? (
          <EmptyState>
            {searchQuery ? (
              <Text type="secondary">{t("No todos match your search.")}</Text>
            ) : (
              <>
                <Text type="secondary">{t("No todos yet.")}</Text>
                <Button
                  type="button"
                  onClick={handleCreateTodo}
                  icon={<PlusIcon />}
                >
                  {t("Create your first todo")}
                </Button>
              </>
            )}
          </EmptyState>
        ) : (
          <TodosList>
            {filteredTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onEdit={handleEditTodo}
                onDelete={handleDeleteTodo}
              />
            ))}
          </TodosList>
        )}
      </Content>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const Header = styled.div`
  padding: 24px 24px 16px;
  border-bottom: 1px solid ${s("divider")};
`;

const HeaderTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: ${s("text")};
  margin: 0 0 8px;
`;

const Stats = styled(Text).attrs({ type: "secondary" })`
  font-size: 14px;
`;

const OverdueCount = styled.span`
  color: #e74c3c;
  font-weight: medium;
`;

const Controls = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
`;

const SearchContainer = styled.div`
  flex: 1;
  max-width: 300px;
`;

const FormContainer = styled.div`
  margin: 16px 24px;
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  height: 200px;
`;

const TodosList = styled.div`
  display: flex;
  flex-direction: column;
`;

export default observer(TodoList);
