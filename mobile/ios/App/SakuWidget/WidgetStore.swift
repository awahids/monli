import Foundation

/// What the home screen widget shows, shared through the app group: the app
/// writes it (WidgetBridgePlugin) and the widget extension reads it.
struct WidgetStore {
    static let appGroup = "group.digital.qala.saku"
    static let kind = "SakuWidget"

    struct Snapshot {
        var label: String
        var value: String
        var detail: String
        var updated: String
    }

    private static var defaults: UserDefaults { UserDefaults(suiteName: appGroup) ?? .standard }

    static func save(_ snapshot: Snapshot) {
        let d = defaults
        d.set(snapshot.label, forKey: "label")
        d.set(snapshot.value, forKey: "value")
        d.set(snapshot.detail, forKey: "detail")
        d.set(snapshot.updated, forKey: "updated")
    }

    /// Nil until the app has sent numbers once.
    static func load() -> Snapshot? {
        let d = defaults
        guard let value = d.string(forKey: "value"), !value.isEmpty else { return nil }
        return Snapshot(
            label: d.string(forKey: "label") ?? "",
            value: value,
            detail: d.string(forKey: "detail") ?? "",
            updated: d.string(forKey: "updated") ?? ""
        )
    }
}
