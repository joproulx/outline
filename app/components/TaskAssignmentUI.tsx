import { observer } from "mobx-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { PlusIcon, UserIcon } from "outline-icons";
import { s } from "@shared/styles";
import { Avatar, AvatarSize } from "~/components/Avatar";
import Button from "~/components/Button";
import Facepile from "~/components/Facepile";
import Text from "~/components/Text";
import Tooltip from "~/components/Tooltip";
import Task, { type TaskAssignee } from "~/models/Task";
import User from "~/models/User";
import useCurrentUser from "~/hooks/useCurrentUser";
import useStores from "~/hooks/useStores";
import Logger from "~/utils/Logger";

type Props = {
  task: Task;
  /** Whether to show a compact view with just avatars */
  compact?: boolean;
  /** Whether to show assignment controls */
  showControls?: boolean;
  /** Maximum number of avatars to show before showing overflow */
  maxAvatars?: number;
};

const TaskAssignmentUI = ({
  task,
  compact = false,
  showControls = true,
  maxAvatars = 3,
}: Props) => {
  const { t } = useTranslation();
  const { tasks } = useStores();
  const currentUser = useCurrentUser();
  const [isAssigning, setIsAssigning] = React.useState(false);

  // Convert TaskAssignee to User-like objects for Facepile
  const assigneeUsers = React.useMemo(
    () =>
      task.assignees.map((assignee: TaskAssignee) => ({
        id: assignee.id,
        name: assignee.name,
        avatarUrl: null, // We don't have avatar URLs in TaskAssignee
        color: null,
        initial: assignee.name.charAt(0).toUpperCase(),
        email: assignee.email,
      })) as User[],
    [task.assignees]
  );

  // Check if current user is assigned to this task
  const isAssignedToMe = React.useMemo(
    () => task.assignees.some((assignee) => assignee.id === currentUser.id),
    [task.assignees, currentUser.id]
  );

  const handleAssignToMe = React.useCallback(async () => {
    if (isAssignedToMe || isAssigning) {
      return;
    }

    setIsAssigning(true);
    try {
      await tasks.assign(task, currentUser.id);
    } catch (error) {
      Logger.error("Failed to assign task", error as Error, {
        taskId: task.id,
        userId: currentUser.id,
      });
      // TODO: Show error toast
    } finally {
      setIsAssigning(false);
    }
  }, [isAssignedToMe, isAssigning, tasks, task, currentUser.id]);

  const handleUnassignFromMe = React.useCallback(async () => {
    if (!isAssignedToMe || isAssigning) {
      return;
    }

    setIsAssigning(true);
    try {
      await tasks.unassign(task, currentUser.id);
    } catch (error) {
      Logger.error("Failed to unassign task", error as Error, {
        taskId: task.id,
        userId: currentUser.id,
      });
      // TODO: Show error toast
    } finally {
      setIsAssigning(false);
    }
  }, [isAssignedToMe, isAssigning, tasks, task, currentUser.id]);

  if (compact) {
    return (
      <CompactContainer>
        {task.assigneeCount > 0 ? (
          <Facepile
            users={assigneeUsers}
            limit={maxAvatars}
            size={AvatarSize.Small}
            overflow={Math.max(0, task.assigneeCount - maxAvatars)}
          />
        ) : (
          <UnassignedText>{t("Unassigned")}</UnassignedText>
        )}
      </CompactContainer>
    );
  }

  return (
    <Container>
      <Header>
        <AssignmentText size="small" type="secondary">
          {task.assignmentSummary}
        </AssignmentText>
        {showControls && (
          <Controls>
            {isAssignedToMe ? (
              <Tooltip tooltip={t("Remove yourself from task")} placement="top">
                <Button
                  type="button"
                  size="small"
                  icon={<UserIcon />}
                  onClick={handleUnassignFromMe}
                  disabled={isAssigning}
                  neutral
                >
                  {isAssigning ? t("Removing...") : t("Unassign me")}
                </Button>
              </Tooltip>
            ) : (
              <Tooltip tooltip={t("Assign yourself to task")} placement="top">
                <Button
                  type="button"
                  size="small"
                  icon={<PlusIcon />}
                  onClick={handleAssignToMe}
                  disabled={isAssigning}
                  neutral
                >
                  {isAssigning ? t("Assigning...") : t("Assign to me")}
                </Button>
              </Tooltip>
            )}
          </Controls>
        )}
      </Header>

      {task.assigneeCount > 0 && (
        <AssigneeList>
          {task.assignees.map((assignee: TaskAssignee) => (
            <AssigneeItem key={assignee.id}>
              <Avatar
                model={{
                  id: assignee.id,
                  name: assignee.name,
                  avatarUrl: null,
                  color: null,
                  initial: assignee.name.charAt(0).toUpperCase(),
                }}
                size={AvatarSize.Medium}
              />
              <AssigneeInfo>
                <AssigneeName size="small">{assignee.name}</AssigneeName>
                <AssigneeEmail size="xsmall" type="secondary">
                  {assignee.email}
                </AssigneeEmail>
              </AssigneeInfo>
              {showControls && assignee.id === currentUser.id && (
                <Tooltip tooltip={t("Remove yourself")} placement="top">
                  <RemoveButton
                    type="button"
                    size="small"
                    icon={<UserIcon />}
                    onClick={handleUnassignFromMe}
                    disabled={isAssigning}
                    neutral
                  />
                </Tooltip>
              )}
            </AssigneeItem>
          ))}
        </AssigneeList>
      )}
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const CompactContainer = styled.div`
  display: flex;
  align-items: center;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const AssignmentText = styled(Text)`
  color: ${s("textSecondary")};
  font-weight: 500;
`;

const UnassignedText = styled(Text).attrs({ size: "small", type: "secondary" })`
  color: ${s("textTertiary")};
  font-style: italic;
`;

const Controls = styled.div`
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;

  ${Container}:hover & {
    opacity: 1;
  }
`;

const AssigneeList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const AssigneeItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
`;

const AssigneeInfo = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
`;

const AssigneeName = styled(Text)`
  font-weight: 500;
  color: ${s("text")};
`;

const AssigneeEmail = styled(Text)`
  color: ${s("textTertiary")};
`;

const RemoveButton = styled(Button)`
  opacity: 0;
  transition: opacity 0.2s ease;

  ${AssigneeItem}:hover & {
    opacity: 1;
  }
`;

export default observer(TaskAssignmentUI);
