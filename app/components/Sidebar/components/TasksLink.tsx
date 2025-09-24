import { observer } from "mobx-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { CheckboxIcon } from "outline-icons";
import SidebarLink from "~/components/Sidebar/components/SidebarLink";
import useStores from "~/hooks/useStores";
import { tasksPath } from "~/utils/routeHelpers";

const TasksLink = () => {
  const { t } = useTranslation();
  const { tasks } = useStores();

  return (
    <SidebarLink
      to={tasksPath()}
      icon={<CheckboxIcon checked={false} />}
      exact={false}
      label={t("Tasks")}
      active={tasks.activeCount > 0}
    />
  );
};

export default observer(TasksLink);
