import { observer } from "mobx-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { CheckboxIcon } from "outline-icons";
import SidebarLink from "~/components/Sidebar/components/SidebarLink";
import useStores from "~/hooks/useStores";
import { todosPath } from "~/utils/routeHelpers";

const TodosLink = () => {
  const { t } = useTranslation();
  const { todos } = useStores();

  return (
    <SidebarLink
      to={todosPath()}
      icon={<CheckboxIcon checked={false} />}
      exact={false}
      label={t("Todos")}
      active={todos.activeCount > 0}
    />
  );
};

export default observer(TodosLink);
