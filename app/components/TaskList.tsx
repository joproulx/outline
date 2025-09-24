import { observer } from "mobx-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { PlusIcon } from "outline-icons";
import { s } from "@shared/styles";
import Button from "~/components/Button";
import Input from "~/components/Input";
import Text from "~/components/Text";
import TaskForm from "~/components/TaskForm";
import TaskItem from "~/components/TaskItem";
import Task from "~/models/Task";
import useStores from "~/hooks/useStores";

const TaskList = () => {
  const { t } = useTranslation();
  const { tasks } = useStores();

  const [showForm, setShowForm] = React.useState(false);
  const [editingTaskId, setEditingTaskId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");

  React.useEffect(() => {
    if (!tasks.isLoaded && !tasks.isFetching) {
      tasks.fetchPage();
    }
  }, [tasks.isLoaded, tasks.isFetching, tasks]);

  const filteredTasks = React.useMemo(() => {
    let result = tasks.all;

    // Apply search filter
    if (searchQuery) {
      result = tasks.search(searchQuery);
    }

    return result.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, tasks, tasks.isLoaded, tasks.all.length]);

  const handleCreateTask = React.useCallback(() => {
    setEditingTaskId(null);
    setShowForm(true);
  }, []);

  const handleEditTask = React.useCallback((task: Task) => {
    setEditingTaskId(task.id);
    setShowForm(false); // Don't show the separate form
  }, []);

  const handleDeleteTask = React.useCallback(
    async (task: Task) => {
      if (window.confirm(t("Are you sure you want to delete this task?"))) {
        await tasks.delete(task);
      }
    },
    [tasks, t]
  );

  const handleSaveTask = React.useCallback(() => {
    setShowForm(false);
    setEditingTaskId(null);
  }, []);

  const handleCancelEdit = React.useCallback(() => {
    setEditingTaskId(null);
  }, []);

  const handleCancelForm = React.useCallback(() => {
    setShowForm(false);
    setEditingTaskId(null);
  }, []);

  const stats = tasks.stats;

  return (
    <Container>
      <Header>
        <HeaderTop>
          <div>
            <Title>{t("Tasks")}</Title>
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
          <Button type="button" onClick={handleCreateTask} icon={<PlusIcon />}>
            {t("Add Task")}
          </Button>
        </HeaderTop>

        <Controls>
          <SearchContainer>
            <Input
              placeholder={t("Search tasks...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </SearchContainer>
        </Controls>
      </Header>

      {showForm && (
        <FormContainer>
          <TaskForm
            task={undefined}
            onSave={handleSaveTask}
            onCancel={handleCancelForm}
          />
        </FormContainer>
      )}

      <Content>
        {filteredTasks.length === 0 ? (
          <EmptyState>
            {searchQuery ? (
              <Text type="secondary">{t("No tasks match your search.")}</Text>
            ) : (
              <>
                <Text type="secondary">{t("No tasks yet.")}</Text>
                <Button
                  type="button"
                  onClick={handleCreateTask}
                  icon={<PlusIcon />}
                >
                  {t("Create your first task")}
                </Button>
              </>
            )}
          </EmptyState>
        ) : (
          <TasksList>
            {filteredTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                isEditing={editingTaskId === task.id}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                onSave={handleSaveTask}
                onCancel={handleCancelEdit}
              />
            ))}
          </TasksList>
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

const TasksList = styled.div`
  display: flex;
  flex-direction: column;
`;

export default observer(TaskList);
