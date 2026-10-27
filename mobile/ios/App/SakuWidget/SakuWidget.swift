import SwiftUI
import WidgetKit

private let teal = Color(red: 14 / 255, green: 128 / 255, blue: 121 / 255)
private let deepTeal = Color(red: 10 / 255, green: 91 / 255, blue: 86 / 255)

struct SakuEntry: TimelineEntry {
    let date: Date
    let snapshot: WidgetStore.Snapshot?
}

struct SakuProvider: TimelineProvider {
    func placeholder(in context: Context) -> SakuEntry {
        SakuEntry(
            date: .now,
            snapshot: .init(label: "Sisa jatah hari ini", value: "Rp 150.000", detail: "Sisa Rp 900.000 · 6 hari", updated: "")
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (SakuEntry) -> Void) {
        completion(context.isPreview ? placeholder(in: context) : SakuEntry(date: .now, snapshot: WidgetStore.load()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<SakuEntry>) -> Void) {
        // The app reloads this (WidgetBridgePlugin) whenever Beranda has new numbers.
        completion(Timeline(entries: [SakuEntry(date: .now, snapshot: WidgetStore.load())], policy: .never))
    }
}

/// Today's allowance (or today's spending) and, on the medium size, a "+ Catat" button.
struct SakuWidgetView: View {
    @Environment(\.widgetFamily) private var family
    let entry: SakuEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(entry.snapshot?.label ?? "Qala Saku")
                .font(.caption)
                .foregroundStyle(.white.opacity(0.85))
                .lineLimit(1)
            Text(entry.snapshot?.value ?? "—")
                .font(.system(size: family == .systemSmall ? 20 : 24, weight: .bold, design: .rounded))
                .foregroundStyle(.white)
                .lineLimit(1)
                .minimumScaleFactor(0.6)
            Text(entry.snapshot?.detail ?? "Buka aplikasi untuk memuat data")
                .font(.caption2)
                .foregroundStyle(.white.opacity(0.85))
                .lineLimit(2)
            Spacer(minLength: 0)
            HStack {
                Text(entry.snapshot?.updated ?? "")
                    .font(.system(size: 9))
                    .foregroundStyle(.white.opacity(0.6))
                    .lineLimit(1)
                Spacer(minLength: 0)
                if family != .systemSmall {
                    Link(destination: URL(string: "qalasaku://add")!) {
                        Text("+ Catat")
                            .font(.caption.bold())
                            .foregroundStyle(teal)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(.white, in: Capsule())
                    }
                }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .widgetURL(URL(string: "qalasaku://open"))
    }
}

@main
struct SakuWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: WidgetStore.kind, provider: SakuProvider()) { entry in
            SakuWidgetView(entry: entry)
                .containerBackground(for: .widget) {
                    LinearGradient(colors: [teal, deepTeal], startPoint: .topLeading, endPoint: .bottomTrailing)
                }
        }
        .configurationDisplayName("Qala Saku")
        .description("Sisa jatah hari ini dan tombol catat cepat.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
