import { zodResolver } from "@hookform/resolvers/zod";
import { createUserSchema, updateUserSchema, type CreateUserInput, type UpdateUserInput } from "core/users";
import { AlertCircleIcon, LoaderCircleIcon } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type UserFormMode = "create" | "edit";

type UserFormDialogProps = {
  errorMessage?: string;
  initialValues?: {
    name: string;
    email: string;
  };
  isOpen: boolean;
  isSubmitting: boolean;
  mode: UserFormMode;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreateUserInput | UpdateUserInput) => Promise<void>;
};

function getDialogCopy(mode: UserFormMode) {
  if (mode === "edit") {
    return {
      description: "修改姓名、邮箱或密码。密码留空时将保持当前密码不变。",
      passwordDescription: "留空则不修改密码",
      submitLabel: "保存修改",
      submittingLabel: "保存中...",
      title: "编辑用户",
    };
  }

  return {
    description: "输入姓名、邮箱和初始密码后，系统会创建一个默认角色为 agent 的新账号。",
    passwordDescription: undefined,
    submitLabel: "创建用户",
    submittingLabel: "创建中...",
    title: "创建新用户",
  };
}

export function UserFormDialog({
  errorMessage,
  initialValues,
  isOpen,
  isSubmitting,
  mode,
  onOpenChange,
  onSubmit,
}: UserFormDialogProps) {
  const copy = getDialogCopy(mode);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(mode === "create" ? createUserSchema : updateUserSchema),
    defaultValues: {
      email: initialValues?.email ?? "",
      name: initialValues?.name ?? "",
      password: "",
    },
  });

  useEffect(() => {
    reset({
      email: initialValues?.email ?? "",
      name: initialValues?.name ?? "",
      password: "",
    });
  }, [initialValues?.email, initialValues?.name, isOpen, mode, reset]);

  return (
    <Dialog onOpenChange={onOpenChange} open={isOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        <form
          className="mt-6 grid gap-5"
          noValidate
          onSubmit={handleSubmit((values) => onSubmit(values as CreateUserInput | UpdateUserInput))}
        >
          <div className="grid gap-2">
            <Label htmlFor="user-form-name">姓名</Label>
            <Input
              id="user-form-name"
              aria-invalid={errors.name ? "true" : "false"}
              autoComplete="name"
              className="h-11"
              placeholder="请输入姓名"
              {...register("name")}
            />
            {errors.name ? <p className="text-sm text-destructive">{errors.name.message}</p> : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="user-form-email">电子邮件</Label>
            <Input
              id="user-form-email"
              aria-invalid={errors.email ? "true" : "false"}
              autoComplete="email"
              className="h-11"
              placeholder="user@example.com"
              type="email"
              {...register("email")}
            />
            {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="user-form-password">密码</Label>
            <Input
              id="user-form-password"
              aria-invalid={errors.password ? "true" : "false"}
              autoComplete={mode === "edit" ? "off" : "new-password"}
              className="h-11"
              placeholder={mode === "edit" ? "如需修改请输入新密码" : "请输入至少 8 位密码"}
              type="password"
              {...register("password")}
            />
            {errors.password ? (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            ) : copy.passwordDescription ? (
              <p className="text-sm text-muted-foreground">{copy.passwordDescription}</p>
            ) : null}
          </div>

          {errorMessage ? (
            <Alert variant="destructive">
              <AlertCircleIcon className="size-4" />
              <AlertTitle>{mode === "edit" ? "保存失败" : "创建失败"}</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter>
            <Button disabled={isSubmitting} onClick={() => onOpenChange(false)} type="button" variant="outline">
              取消
            </Button>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? (
                <>
                  <LoaderCircleIcon className="size-4 animate-spin" />
                  {copy.submittingLabel}
                </>
              ) : (
                copy.submitLabel
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
