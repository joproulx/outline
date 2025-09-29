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
import useCurrentUser from "~/hooks/useCurrentUser";
import Logger from "~/utils/Logger";

type TaskFilter =
  | "all"
  | "assigned"
  | "unassigned"
  | "assigned-to-me"
  | "overdue"
  | "due-today";

const TaskList = () => {
  const { t } = useTranslation();
  const { tasks } = useStores();
  const currentUser = useCurrentUser();

  const [showForm, setShowForm] = React.useState(false);
  const [editingTaskId, setEditingTaskId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = React.useState("");
  const [activeFilter, setActiveFilter] = React.useState<TaskFilter>("all");

  // Debounce search query to improve performance
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  React.useEffect(() => {
    Logger.info("store", "TaskList useEffect: checking if need to fetch", {
      tasksIsLoaded: tasks.isLoaded,
      tasksIsFetching: tasks.isFetching,
      tasksDataSize: tasks.data.size,
    });

    if (!tasks.isLoaded && !tasks.isFetching) {
      Logger.info("store", "TaskList useEffect: calling fetchPage");
      tasks.fetchPage();
    }
  }, [tasks.isLoaded, tasks.isFetching, tasks]);

  const filteredTasks = React.useMemo(() => {
    Logger.info("store", "TaskList filtering tasks", {
      activeFilter,
      tasksIsLoaded: tasks.isLoaded,
      tasksDataSize: tasks.data.size,
      tasksAllLength: tasks.all.length,
      tasksUnassignedLength: tasks.unassigned.length,
    });

    let result = tasks.all;

    // Apply filter
    switch (activeFilter) {
      case "assigned":
        result = tasks.assigned;
        break;
      case "unassigned":
        result = tasks.unassigned;
        break;
      case "assigned-to-me":
        result = tasks.byAssignee(currentUser.id);
        break;
      case "overdue":
        result = tasks.overdue;
        break;
      case "due-today":
        result = tasks.dueToday;
        break;
      case "all":
      default:
        result = tasks.all;
        break;
    }

    Logger.info("store", "TaskList filter result", {
      activeFilter,
      resultLength: result.length,
    });

    // Apply search filter with debounced search
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.trim().toLowerCase();
      result = result.filter((task) => {
        const titleMatch = task.title.toLowerCase().includes(query);
        const descMatch = task.description?.toLowerCase().includes(query) ?? false;
        const tagMatch = task.tags.some((tag) => tag.toLowerCase().includes(query));
        return titleMatch || descMatch || tagMatch;
      });
    }

    // Defensive: sort only if result is not empty
    const sortedResult = result.length > 1
      ? [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      : result;

    return sortedResult;
  }, [
    activeFilter,
    debouncedSearchQuery,
    tasks.all,
    tasks.assigned,
    tasks.unassigned,
    tasks.overdue,
    tasks.dueToday,
    currentUser.id,
  ]);

  const handleCreateTask = React.useCallback(() => {
    setEditingTaskId(null);
    setShowForm(true);
  }, []);

  const handleEditTask = React.useCallback((task: Task) => {
    setEditingTaskId(task.id);
    setShowForm(false); // Don't show the separate form
  }, []);

  const handleDeleteTask = React.useCallback(
    (task: Task) => {
      // Use setTimeout to make the confirmation non-blocking
      setTimeout(async () => {
        if (window.confirm(t("Are you sure you want to delete this task?"))) {
          try {
            await tasks.delete(task);
          } catch (_error) {
            // Error will be handled by the tasks store error handling
            // Could show a toast notification here
          }
        }
      }, 0);
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

  const filterOptions: Array<{
    key: TaskFilter;
    label: string;
    count: number;
  }> = React.useMemo(
    () => [
      { key: "all", label: t("All"), count: stats.total },
      {
        key: "assigned-to-me",
        label: t("Assigned to me"),
        count: stats.assignedToMe,
      },
      { key: "assigned", label: t("Assigned"), count: stats.assigned },
      { key: "unassigned", label: t("Unassigned"), count: stats.unassigned },
      { key: "overdue", label: t("Overdue"), count: stats.overdue },
      { key: "due-today", label: t("Due today"), count: stats.dueToday },
    ],
    [stats, t]
  );

  return (
    <Container>
      <Header>
        <HeaderTop>
          <div>
            <Title>{t("Tasks")}</Title>
            <Stats>
              {stats.total} {t("tasks")}
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
          <FiltersContainer>
            {filterOptions.map((option) => (
              <FilterButton
                key={option.key}
                type="button"
                onClick={() => setActiveFilter(option.key)}
                $active={activeFilter === option.key}
                neutral
                size="small"
              >
                {option.label}
                <FilterCount $active={activeFilter === option.key}>
                  {option.count}
                </FilterCount>
              </FilterButton>
            ))}
          </FiltersContainer>
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
            {debouncedSearchQuery ? (
              <Text type="secondary">{t("No tasks match your search.")}</Text>
            ) : activeFilter !== "all" ? (
              <Text type="secondary">
                {t("No {{filter}} tasks.", {
                  filter: filterOptions
                    .find((f) => f.key === activeFilter)
                    ?.label.toLowerCase(),
                })}
              </Text>
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
  flex-direction: column;
  gap: 16px;
`;

const FiltersContainer = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
`;

const FilterButton = styled(Button) <{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  background: ${(props) => (props.$active ? s("accent") : "transparent")};
  color: ${(props) => (props.$active ? s("white") : s("textSecondary"))};
  border: 1px solid
    ${(props) => (props.$active ? s("accent") : s("inputBorder"))};

  &:hover {
    background: ${(props) =>
    props.$active ? s("accent") : s("secondaryBackground")};
    border-color: ${(props) =>
    props.$active ? s("accent") : s("inputBorderFocused")};
  }
`;

const FilterCount = styled.span<{ $active: boolean }>`
  background: ${(props) =>
    props.$active ? "rgba(255,255,255,0.2)" : s("secondaryBackground")};
  color: ${(props) => (props.$active ? s("white") : s("textTertiary"))};
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 11px;
  font-weight: 500;
  min-width: 18px;
  text-align: center;
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
