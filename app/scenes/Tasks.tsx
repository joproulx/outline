import { observer } from "mobx-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { CheckboxIcon } from "outline-icons";
import Scene from "~/components/Scene";
import TaskList from "~/components/TaskList";

function Tasks() {
  const { t } = useTranslation();

  return (
    <Scene title={t("Tasks")} icon={<CheckboxIcon checked={false} />}>
      <TaskList />
    </Scene>
  );
}

export default observer(Tasks);
