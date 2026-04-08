import { zodResolver } from "@hookform/resolvers/zod";
import { Navigate, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { authClient } from "../lib/auth-client";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "请输入邮箱")
    .email("请输入有效的邮箱地址"),
  password: z
    .string()
    .min(1, "请输入密码")
    .min(6, "密码至少需要 6 个字符"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function getLoginErrorMessage(error: { message?: string; status?: number } | null) {
  if (!error) {
    return "登录失败，请稍后再试。";
  }

  const normalizedMessage = error.message?.trim().toLowerCase();

  if (error.status === 401 || normalizedMessage === "invalid email or password") {
    return "邮箱或密码错误。";
  }

  return error.message || "登录失败，请稍后再试。";
}

export function LoginPages() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  if (!isPending && session) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async ({ email, password }: LoginFormValues) => {
    clearErrors("root");
    const { error } = await authClient.signIn.email({
      email,
      password,
    });

    if (error) {
      setError("root", {
        type: "server",
        message: getLoginErrorMessage(error),
      });
      return;
    }

    navigate("/", { replace: true });
  };

  if (isPending) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#f4efe7] text-slate-700">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(53,135,102,0.18),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(208,111,64,0.12),transparent_28%)]"
        />
        <div className="relative grid min-h-screen place-items-center p-4 md:p-8">
          <div className="w-full max-w-[440px] rounded-[28px] border border-[rgba(30,62,46,0.12)] bg-[rgba(255,253,249,0.92)] p-8 text-left shadow-[0_16px_35px_rgba(20,40,33,0.1)] backdrop-blur-xl">
            <p className="m-0 text-xs uppercase tracking-[0.16em] text-slate-500">Loading</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-900">
              正在检查现有登录状态
            </h1>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f4efe7] text-slate-700">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(53,135,102,0.18),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(208,111,64,0.12),transparent_28%)]"
      />
      <div className="relative grid min-h-screen place-items-center p-4 md:p-8">
        <section className="grid w-full max-w-[440px] justify-center">
          <div className="flex w-full items-center rounded-[28px] border border-[rgba(30,62,46,0.12)] bg-[rgba(255,253,249,0.92)] p-8 shadow-[0_16px_35px_rgba(20,40,33,0.1)] backdrop-blur-xl">
            <form className="grid w-full gap-[18px]" noValidate onSubmit={handleSubmit(onSubmit)}>
              <div className="grid gap-2">
                <p className="m-0 text-xs uppercase tracking-[0.16em] text-slate-500">
                  Secure Access
                </p>
                <h2 className="text-[1.8rem] font-semibold text-slate-900">邮箱密码登录</h2>
                <p className="m-0 text-slate-500">使用已有账号登录后将直接跳转到主页。</p>
              </div>

              <label className="grid gap-2.5 font-semibold text-slate-900">
                <span>邮箱</span>
                <input
                  autoComplete="email"
                  className={`w-full rounded-2xl border bg-white/90 px-4 py-3.5 text-slate-900 transition focus:-translate-y-0.5 focus:outline-none ${
                    errors.email
                      ? "border-red-500 shadow-[0_0_0_1px_rgba(176,59,36,0.08)] focus:border-red-600 focus:shadow-[0_0_0_4px_rgba(176,59,36,0.16)]"
                      : "border-[rgba(15,61,62,0.18)] focus:border-[rgba(15,61,62,0.4)] focus:shadow-[0_0_0_4px_rgba(30,111,92,0.12)]"
                  }`}
                  placeholder="admin@example.com"
                  type="email"
                  {...register("email")}
                />
              </label>
              {errors.email ? (
                <p className="-mt-1 text-[0.92rem] text-[#b03b24]">{errors.email.message}</p>
              ) : null}

              <label className="grid gap-2.5 font-semibold text-slate-900">
                <span>密码</span>
                <input
                  autoComplete="current-password"
                  className={`w-full rounded-2xl border bg-white/90 px-4 py-3.5 text-slate-900 transition focus:-translate-y-0.5 focus:outline-none ${
                    errors.password
                      ? "border-red-500 shadow-[0_0_0_1px_rgba(176,59,36,0.08)] focus:border-red-600 focus:shadow-[0_0_0_4px_rgba(176,59,36,0.16)]"
                      : "border-[rgba(15,61,62,0.18)] focus:border-[rgba(15,61,62,0.4)] focus:shadow-[0_0_0_4px_rgba(30,111,92,0.12)]"
                  }`}
                  placeholder="请输入密码"
                  type="password"
                  {...register("password")}
                />
              </label>
              {errors.password ? (
                <p className="-mt-1 text-[0.92rem] text-[#b03b24]">{errors.password.message}</p>
              ) : null}

              {errors.root?.message ? (
                <p className="m-0 rounded-2xl bg-[#feece8] px-3.5 py-3 text-[#b03b24]">
                  {errors.root.message}
                </p>
              ) : null}

              <button
                className="rounded-full bg-[linear-gradient(135deg,#154b4c_0%,#2a7e67_100%)] px-5 py-3.5 font-bold text-white shadow-[0_18px_30px_rgba(30,111,92,0.22)] transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? "登录中..." : "登录并进入主页"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
