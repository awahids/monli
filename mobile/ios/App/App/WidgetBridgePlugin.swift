import Capacitor
import WidgetKit

/// Hands the home screen widget its numbers. The site calls update() from
/// Beranda (lib/widget.ts in the web repo); the widget shows them until the next call.
@objc(WidgetBridgePlugin)
public class WidgetBridgePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "WidgetBridgePlugin"
    public let jsName = "WidgetBridge"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "update", returnType: CAPPluginReturnPromise)
    ]

    @objc func update(_ call: CAPPluginCall) {
        WidgetStore.save(
            .init(
                label: call.getString("label") ?? "",
                value: call.getString("value") ?? "",
                detail: call.getString("detail") ?? "",
                updated: call.getString("updated") ?? ""
            )
        )
        WidgetCenter.shared.reloadTimelines(ofKind: WidgetStore.kind)
        call.resolve()
    }
}
