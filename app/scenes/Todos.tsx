import { observer } from "mobx-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { CheckboxIcon } from "outline-icons";
import Scene from "~/components/Scene";
import TodoList from "~/components/TodoList";

function Todos() {
  const { t } = useTranslation();

  return (
    <Scene title={t("Todos")} icon={<CheckboxIcon checked={false} />}>
      <TodoList />
    </Scene>
  );
}

export default observer(Todos);
