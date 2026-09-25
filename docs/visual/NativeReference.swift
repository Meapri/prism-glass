import SwiftUI
import AVKit

@main struct PrismReferenceApp: App {
    var body: some Scene { WindowGroup { Group { if ProcessInfo.processInfo.arguments.contains("--motion") { MotionReference() } else { ReferenceRoot() } }.preferredColorScheme(ProcessInfo.processInfo.arguments.contains("--dark") ? .dark : .light) } }
}
struct ReferenceRoot: View {
    @State var selection = ProcessInfo.processInfo.arguments.contains("--materials") ? 1 : ProcessInfo.processInfo.arguments.contains("--media") ? 2 : 0
    var body: some View {
        TabView(selection: $selection) {
            ControlsReference().tag(0).tabItem { Label("Controls", systemImage: "slider.horizontal.3") }
            MaterialReference().tag(1).tabItem { Label("Materials", systemImage: "square.on.circle") }
            VideoReference().tag(2).tabItem { Label("Media", systemImage: "play.rectangle") }
        }
    }
}
struct ControlsReference: View {
    @State var enabled = true
    @State var value = 0.5
    @State var selection = 0
    @State var presses = 0
    var body: some View {
        NavigationStack {
            Form {
                Section("Glass buttons") {
                    HStack(spacing: 20) {
                        Button("Done") { presses += 1 }.buttonStyle(.glass)
                        Button("Add", systemImage: "plus") { presses += 1 }.buttonStyle(.glass)
                        Button { presses += 1 } label: { Image(systemName: "plus") }.buttonStyle(.glass).buttonBorderShape(.circle)
                    }.padding(.vertical, 12)
                    Text("Pressed \(presses)").font(.footnote).foregroundStyle(.secondary)
                }
                Section("Standard controls") {
                    Toggle("Notifications", isOn: $enabled)
                    VStack(alignment: .leading, spacing: 18) {
                        Text("Volume  \(Int(value * 100))%")
                        Slider(value: $value)
                    }.padding(.vertical, 10)
                    Picker("Selection", selection: $selection) {
                        Text("First").tag(0); Text("Second").tag(1); Text("Third").tag(2)
                    }.pickerStyle(.segmented).padding(.vertical, 8)
                }
                Section("Toolbar buttons") {
                    HStack(spacing: 14) {
                        Button("Back", systemImage: "chevron.left") {}.buttonStyle(.glass)
                        Button("Edit") {}.buttonStyle(.glass)
                        Button("Confirm") {}.buttonStyle(.glassProminent)
                    }.padding(.vertical, 12)
                }
                Text("iOS 27.0 · Native SwiftUI defaults\nNo custom blur or refraction parameters.").font(.footnote).foregroundStyle(.secondary)
            }
            .navigationTitle("Native iOS 27")
            .toolbar { ToolbarItem(placement: .topBarTrailing) { Button("More", systemImage: "ellipsis") {} } }
        }
    }
}
struct MaterialReference: View {
    @State var picture: UIImage?
    private var isFlat: Bool { ProcessInfo.processInfo.arguments.contains("--flat") }
    private var regularGlass: Glass { isFlat ? .identity : .regular }
    private var clearGlass: Glass { isFlat ? .identity : .clear }
    var body: some View {
        NavigationStack {
            ZStack {
                if let picture { Image(uiImage: picture).resizable().scaledToFill() }
                else { Color.gray }
                VStack(spacing: 34) {
                    HStack(spacing: 28) {
                        Text("Regular").font(.body.weight(.medium)).frame(width: 130, height: 48).onGeometryChange(for: CGRect.self) { $0.frame(in: .global) } action: { print("REGULAR_PILL", $0) }.glassEffect(regularGlass, in: .capsule)
                        Text("Clear").font(.body.weight(.medium)).foregroundStyle(.white).frame(width: 130, height: 48).glassEffect(clearGlass, in: .capsule).background(.black.opacity(0.35), in: Capsule())
                    }
                    HStack(spacing: 36) {
                        Image(systemName: "pause.fill").font(.system(size: 32, weight: .medium)).frame(width: 104, height: 104).onGeometryChange(for: CGRect.self) { $0.frame(in: .global) } action: { print("REGULAR_CIRCLE", $0) }.glassEffect(regularGlass.interactive(), in: .circle)
                        Image(systemName: "pause.fill").font(.system(size: 32, weight: .medium)).foregroundStyle(.white).frame(width: 104, height: 104).glassEffect(clearGlass.interactive(), in: .circle).background(.black.opacity(0.35), in: Circle())
                    }
                    Text("Regular material\nNative diffusion and edge lighting").font(.body).multilineTextAlignment(.center).frame(width: 324, height: 104).onGeometryChange(for: CGRect.self) { $0.frame(in: .global) } action: { print("REGULAR_PANEL", $0) }.glassEffect(regularGlass, in: .rect(cornerRadius: 28))
                    Text("Clear material").font(.body.weight(.semibold)).foregroundStyle(.white).frame(width: 324, height: 64).glassEffect(clearGlass, in: .capsule).background(.black.opacity(0.35), in: Capsule())
                }.opacity(ProcessInfo.processInfo.arguments.contains("--background-only") ? 0 : 1)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity).clipped()
            .navigationTitle("Native materials").navigationBarTitleDisplayMode(.inline)
            .task {
                let asset = AVURLAsset(url: Bundle.main.url(forResource: "flower", withExtension: "mp4")!)
                let generator = AVAssetImageGenerator(asset: asset)
                generator.appliesPreferredTrackTransform = true
                if let image = try? generator.copyCGImage(at: CMTime(seconds: 2, preferredTimescale: 600), actualTime: nil) { picture = UIImage(cgImage: image) }
            }
        }
    }
}
struct VideoReference: View {
    @State private var player = AVPlayer(url: Bundle.main.url(forResource: "flower", withExtension: "mp4")!)
    var body: some View {
        NavigationStack {
            VideoPlayer(player: player).navigationTitle("Native AVKit").navigationBarTitleDisplayMode(.inline)
                .onAppear { player.seek(to: CMTime(seconds: 2, preferredTimescale: 600)) }
        }
    }
}

struct MotionReference: View {
    @State private var picture: UIImage?
    @State private var shown = true
    @Namespace private var effects
    var body: some View {
        ZStack {
            if let picture { Image(uiImage: picture).resizable().scaledToFill().ignoresSafeArea() }
            GlassEffectContainer(spacing: 20) {
                VStack(spacing: 30) {
                    HStack(spacing: 16) {
                        Button("Save") {}.buttonStyle(.glass).controlSize(.large)
                        Button("Share") {}.buttonStyle(.glass).controlSize(.large)
                        Button("More") {}.buttonStyle(.glass).controlSize(.large)
                    }
                    ZStack {
                        if shown {
                            VStack(spacing: 16) {
                                Text("Liquid Glass").font(.title2.weight(.semibold))
                                Text("Native materialize transition").font(.body)
                            }
                            .frame(width: 310, height: 176)
                            .glassEffect(.regular, in: .rect(cornerRadius: 28))
                            .glassEffectID("panel", in: effects)
                            .glassEffectTransition(.materialize)
                        }
                    }.frame(width: 340, height: 200)
                    Button(shown ? "Hide panel" : "Show panel") {
                        withAnimation { shown.toggle() }
                    }.buttonStyle(.borderedProminent)
                }
            }
        }.task {
            Task {
                for _ in 0..<8 {
                    try? await Task.sleep(for: .seconds(2))
                    withAnimation { shown.toggle() }
                }
            }
            let generator = AVAssetImageGenerator(asset: AVURLAsset(url: Bundle.main.url(forResource: "flower", withExtension: "mp4")!))
            generator.appliesPreferredTrackTransform = true
            if let image = try? generator.copyCGImage(at: CMTime(seconds: 2, preferredTimescale: 600), actualTime: nil) { picture = UIImage(cgImage: image) }
        }
    }
}
