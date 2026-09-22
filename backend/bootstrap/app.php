<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->statefulApi();

        // API専用アプリのため、未認証時にLaravelのデフォルトの'login'名前付きルートへ
        // リダイレクトさせず常に401 JSONを返す
        $middleware->redirectGuestsTo(fn () => null);

        // Railwayなどのプラットフォーム上では、リクエストは常にプラットフォームの
        // 内部プロキシ経由で届く（生のクライアントと直接繋がることはない）ため、
        // 全プロキシを信頼してX-Forwarded-*から実クライアントIPを取得する。
        // 未設定だとRequest::ip()がプロキシ側のIPを返し、IPベースのレート制限等が
        // 正しく機能しない。
        $middleware->trustProxies(at: '*');
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        // ModelNotFoundExceptionはprepareException()でNotFoundHttpExceptionに変換された上でrenderされるため
        // ここで捕まえる。デフォルトのメッセージにモデルの内部クラス名がそのまま含まれるため隠す
        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'Not Found.'], 404);
            }
        });
    })->create();
