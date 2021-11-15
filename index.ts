import "./main.scss";
// @ts-ignore
import { Elm } from "./src/Main.elm";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL as string;
const SUPABASE_KEY = process.env.SUPABASE_KEY as string;
const supabase = createClient(supabaseUrl, SUPABASE_KEY);

// @ts-ignore
window.supabase = supabase;

interface Flags {}

interface Todo {
  id: string;
  value: string;
  status: "checked" | "unchecked";
}

export interface Configuration {
  node: HTMLElement | null;
  flags: Flags;
}

export interface Ports {
  addTodo?: {
    subscribe: (fn: (todo: string) => void) => void;
  };
  switchStatus?: {
    subscribe: (fn: (todoId: string) => void) => void;
  };
  receiveTodos?: {
    send: (todos: Todo[]) => void;
  };
}

// export const init: (configuration: Configuration) => Ports = (
//   configuration
// ) => {
const app = Elm.Main.init({
  node: document.getElementById("app"),
  flags: {},
});
const ports = app.ports;

ports.addTodo?.subscribe((todo: any) => {
  supabase
    .from("todos")
    .insert([{ value: todo }])
    .then(() => console.log("inserted todo"));
});

ports.switchStatus?.subscribe(({ id, status }: any) => {
  supabase
    .from("todos")
    .update({ status: status })
    .eq("id", id)
    .then(() => console.log("checked"));
});

const receiveTodos = () => {
  supabase
    .from("todos")
    .select("*")
    .order("status", { ascending: false })
    .order("created_at", { ascending: false })
    .then(({ data: todos }: any) => {
      ports.receiveTodos?.send(
        todos.map((todo: any) => ({
          id: todo.id || "",
          value: todo.value,
          status: todo.status,
        }))
      );
    });
};

receiveTodos();

supabase
  .from("todos")
  .on("*", (payload) => {
    console.log("* received!", payload);
    receiveTodos();
  })
  .subscribe();
