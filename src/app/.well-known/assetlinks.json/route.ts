import { NextResponse } from "next/server";

export async function GET() {
  const assetlinks = [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: "com.nammathanjai.app",
        sha256_cert_fingerprints": [
          "F4:30:B2:A0:45:0B:76:41:97:08:A9:7B:8C:67:95:E4:F2:95:CF:DF:16:4D:A6:FF:CD:C1:77:30:DC:15:88:EE"
        ]
      }
    }
  ];

  return NextResponse.json(assetlinks, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=86400, immutable"
    }
  });
}
