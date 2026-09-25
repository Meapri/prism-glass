import SwiftUI
import AVKit

@main struct PrismReferenceApp: App {
    var body: some Scene { WindowGroup { Group { if ProcessInfo.processInfo.arguments.contains("--catalog") { CatalogReference() } else if ProcessInfo.processInfo.arguments.contains("--motion") { MotionReference() } else { ReferenceRoot() } }.preferredColorScheme(ProcessInfo.processInfo.arguments.contains("--dark") ? .dark : .light) } }
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

// CATALOG SOURCE
import SwiftUI
import UIKit
import UserNotifications

private let catalogArgs = ProcessInfo.processInfo.arguments
private func argument(_ name: String, fallback: String) -> String {
    catalogArgs.first(where: { $0.hasPrefix(name + "=") }).map { String($0.dropFirst(name.count + 1)) } ?? fallback
}
struct CatalogBackdrop: View {
    @State private var picture: UIImage?
    let kind = argument("--background", fallback: "photo")
    var body: some View {
        GeometryReader { geo in
            if kind == "light" { Color(red: 0.94, green: 0.95, blue: 0.97) }
            else if kind == "dark" { Color(red: 0.08, green: 0.10, blue: 0.14) }
            else if kind == "grid" {
                Canvas { context, size in
                    context.fill(Path(CGRect(origin: .zero, size: size)), with: .color(Color(red:0.94,green:0.95,blue:0.97)))
                    for x in stride(from: 0, to: size.width, by: 20) { context.fill(Path(CGRect(x:x,y:0,width:3,height:size.height)), with:.color(.blue)) }
                    for y in stride(from: 0, to: size.height, by: 20) { context.fill(Path(CGRect(x:0,y:y,width:size.width,height:3)), with:.color(.red)) }
                }
            } else if let picture { Image(uiImage: picture).resizable().scaledToFill().frame(width:geo.size.width,height:geo.size.height).clipped() }
        }.ignoresSafeArea().task {
            let generator = AVAssetImageGenerator(asset: AVURLAsset(url: Bundle.main.url(forResource:"flower",withExtension:"mp4")!))
            generator.appliesPreferredTrackTransform = true
            if let image = try? generator.copyCGImage(at: CMTime(seconds:2,preferredTimescale:600),actualTime:nil) { picture=UIImage(cgImage:image) }
        }
    }
}
struct CatalogReference: View {
    let page = argument("--page", fallback:"buttons")
    @State var count=3
    @State var choice=1
    @State var enabled=true
    @State var query=""
    @State var name="Prism"
    @State var color=Color.blue
    @State var date=Date(timeIntervalSince1970:1790337600)
    @State var modal=false
    @State var menu=false
    @State var sheet=false
    @State var popover=false
    let hidden=catalogArgs.contains("--background-only")
    var body: some View {
        Group {
            if page=="navigation" { navigation }
            else if page=="tabs" { tabs }
            else { ZStack { CatalogBackdrop(); board.opacity(hidden ? 0 : 1) }.ignoresSafeArea() }
        }.tint(catalogArgs.contains("--accent") ? Color.blue : nil)
        .task {
            try? await Task.sleep(for:.milliseconds(400))
            if page=="alert" || page=="input-alert" { modal=true }
            if page=="action-sheet" { menu=true }
            if page=="sheet" { sheet=true }
            if page=="popover" { popover=true }
            try? await Task.sleep(for:.milliseconds(900))
            exportCatalogGeometry(page:page)
        }
    }
    @ViewBuilder var board: some View {
        GeometryReader { geo in
            let mid=geo.size.width/2
            VStack(spacing:6) { Text("Native iOS 27").font(.headline);Text(page).font(.caption) }.position(x:mid,y:105)
            if page=="buttons" {
                Button("Continue") {}.buttonStyle(.glass).position(x:106,y:180)
                Button("Continue") {}.buttonStyle(.glassProminent).position(x:296,y:180)
                Button("Continue") {}.buttonStyle(.glass).disabled(true).position(x:106,y:260)
                Button("Continue") {}.buttonStyle(.glassProminent).disabled(true).position(x:296,y:260)
                Button("Small") {}.buttonStyle(.glass).controlSize(.small).position(x:106,y:340)
                Button("Large") {}.buttonStyle(.glass).controlSize(.large).position(x:296,y:340)
                Button {} label: { Image(systemName:"plus") }.buttonStyle(.glass).buttonBorderShape(.circle).position(x:106,y:420)
                Button {} label: { Image(systemName:"plus") }.buttonStyle(.glassProminent).buttonBorderShape(.circle).position(x:296,y:420)
                Button("Delete",role:.destructive) {}.buttonStyle(.glass).position(x:106,y:500)
                Button("Delete",role:.destructive) {}.buttonStyle(.glassProminent).position(x:296,y:500)
                Button {} label: { HStack { ProgressView().controlSize(.small);Text("Saving") } }.buttonStyle(.glass).position(x:106,y:580)
                Button("Plain") {}.buttonStyle(.plain).position(x:296,y:580)
                Text("Custom regular · interactive").font(.caption).position(x:mid,y:650)
                HStack(spacing:20) {
                    Button("Filter") {}.padding(.horizontal,14).padding(.vertical,8).glassEffect(.regular.interactive(),in:.capsule)
                    Button("Selected") {}.foregroundStyle(.white).padding(.horizontal,14).padding(.vertical,8).glassEffect(.regular.tint(.blue).interactive(),in:.capsule)
                }.position(x:mid,y:710)
            } else if page=="inputs" {
                Picker("View",selection:$choice) { Text("First").tag(0);Text("Second").tag(1);Text("Third").tag(2) }.pickerStyle(.segmented).frame(width:342).position(x:mid,y:180)
                Stepper(value:$count,in:0...10) { EmptyView() }.labelsHidden().frame(width:100).position(x:106,y:270)
                Picker("Quality",selection:$choice) { Text("Low").tag(0);Text("Medium").tag(1);Text("High").tag(2) }.pickerStyle(.menu).position(x:296,y:270)
                TextField("Email",text:$name).textFieldStyle(.roundedBorder).frame(width:342).position(x:mid,y:360)
                HStack(spacing:34) { DatePicker("Date",selection:$date,displayedComponents:.date).labelsHidden();ColorPicker("Color",selection:$color).labelsHidden() }.position(x:mid,y:450)
                ProgressView(value:0.65).frame(width:300).position(x:mid,y:530)
                HStack(spacing:28) { ProgressView();Text("Loading").font(.body) }.position(x:mid,y:585)
                NativePageControl().frame(width:180,height:40).position(x:mid,y:650)
                HStack(spacing:26) {Toggle("Wi-Fi",isOn:$enabled).labelsHidden();Slider(value:.constant(0.5)).frame(width:190)}.position(x:mid,y:740)
            } else if page=="standard-materials" {
                VStack(spacing:26) {
                    materialRow("Ultra thin",.ultraThinMaterial)
                    materialRow("Thin",.thinMaterial)
                    materialRow("Regular",.regularMaterial)
                    materialRow("Thick",.thickMaterial)
                }.position(x:mid,y:440)
            } else if page=="wheel" {
                Picker("Number",selection:$count){ForEach(0..<10){Text("\($0)").tag($0)}}.pickerStyle(.wheel).frame(width:160,height:216).position(x:mid,y:300)
                DatePicker("Date",selection:$date,displayedComponents:.date).datePickerStyle(.graphical).frame(width:342,height:330).background(.background,in:RoundedRectangle(cornerRadius:20)).position(x:mid,y:610)
            } else if page=="menus" {
                Menu {
                    Button("Copy",systemImage:"doc.on.doc"){}
                    Button("Share",systemImage:"square.and.arrow.up"){}
                    Divider()
                    Toggle("Favorite",isOn:$enabled)
                    Button("Unavailable",systemImage:"lock"){}.disabled(true)
                    Button("Delete",systemImage:"trash",role:.destructive){}
                } label: { Label("Actions",systemImage:"ellipsis") }.buttonStyle(.glass).position(x:mid,y:220)
                Text("Context menu").padding(28).glassEffect(.regular,in:.rect(cornerRadius:28)).contextMenu {
                    Button("Copy",systemImage:"doc.on.doc"){}
                    Button("Share",systemImage:"square.and.arrow.up"){}
                    Button("Delete",systemImage:"trash",role:.destructive){}
                }.position(x:mid,y:560)
            } else {
                Button("Present") {modal=true;menu=true;sheet=true;popover=true}.buttonStyle(.glass).position(x:mid,y:210)
                    .alert(page=="input-alert" ? "Rename item" : "Delete item?",isPresented:$modal) {
                        if page=="input-alert" {TextField("Name",text:$name)}
                        Button("Cancel",role:.cancel){}
                        Button(page=="input-alert" ? "Save" : "Delete",role:page=="input-alert" ? nil : .destructive){}
                    } message: {Text(page=="input-alert" ? "Choose a name for this item." : "This item will be removed from your collection.")}
                    .confirmationDialog("Choose an action",isPresented:$menu,titleVisibility:.visible) {
                        Button("Save to collection"){}
                        Button("Share item"){}
                        Button("Delete item",role:.destructive){}
                        Button("Cancel",role:.cancel){}
                    }
                    .sheet(isPresented:$sheet) {
                        NavigationStack {VStack(alignment:.leading,spacing:18) {Text("Details").font(.title2.bold());Text("A native sheet keeps the content readable.");TextField("Name",text:$name).textFieldStyle(.roundedBorder);Spacer()}.padding(24).navigationTitle("Collection").navigationBarTitleDisplayMode(.inline).toolbar {ToolbarItem(placement:.cancellationAction){Button("Cancel"){sheet=false}};ToolbarItem(placement:.confirmationAction){Button("Done"){sheet=false}}}}
                            .presentationDetents([.medium,.large]).presentationDragIndicator(.visible)
                    }
                    .popover(isPresented:$popover,arrowEdge:.top) {
                        VStack(alignment:.leading,spacing:18) {Text("Options").font(.title3.bold());Text("A focused surface for a short task.");Button("Save changes"){popover=false}.buttonStyle(.borderedProminent)}.padding(24).frame(width:290,height:220).presentationCompactAdaptation(.popover)
                    }
            }
        }
    }
    func materialRow(_ title:String,_ material:Material)->some View {
        VStack(alignment:.leading,spacing:6){Text(title).font(.headline);Text("Primary label").foregroundStyle(.primary);Text("Secondary label").foregroundStyle(.secondary)}.frame(width:300,height:104).background(material,in:RoundedRectangle(cornerRadius:28))
    }
    var navigation: some View {
        NavigationStack {ScrollView {VStack(spacing:22) {ForEach(0..<14) { i in Text("Collection item \(i+1)").frame(maxWidth:.infinity,alignment:.leading).padding(24).background(.regularMaterial,in:RoundedRectangle(cornerRadius:20))}}.padding(20)}.background {CatalogBackdrop()}.navigationTitle("Collection").toolbar {
            ToolbarItem(placement:.topBarLeading){Button("Back",systemImage:"chevron.left") {}}
            ToolbarItemGroup(placement:.topBarTrailing){Button("Add",systemImage:"plus"){};Button("More",systemImage:"ellipsis"){}}
            ToolbarItemGroup(placement:.bottomBar){Button("Undo",systemImage:"arrow.uturn.backward"){};Button("Redo",systemImage:"arrow.uturn.forward"){};Spacer();Button("Share",systemImage:"square.and.arrow.up"){} }
        }}
    }
    var tabs: some View {
        TabView {
            Tab("Library",systemImage:"square.grid.2x2") {NavigationStack {CatalogBackdrop().navigationTitle("Library").navigationBarTitleDisplayMode(.inline)}}.badge(2)
            Tab("Explore",systemImage:"safari") {CatalogBackdrop()}
            Tab("Saved",systemImage:"heart") {CatalogBackdrop()}
            Tab(role:.search) {NavigationStack {CatalogBackdrop().searchable(text:$query)}}
        }.tabViewBottomAccessory {HStack {Image(systemName:"music.note");Text("Now playing");Spacer();Button("Play",systemImage:"play.fill"){};Button("Next",systemImage:"forward.fill"){} }.padding(.horizontal,20)}
    }
}
struct NativePageControl:UIViewRepresentable {
    func makeUIView(context:Context)->UIPageControl {let v=UIPageControl();v.numberOfPages=7;v.currentPage=2;v.backgroundStyle = .prominent;return v}
    func updateUIView(_ uiView:UIPageControl,context:Context){}
}

@MainActor func exportCatalogGeometry(page:String) {
    var rows:[[String:Any]]=[]
    func record(_ layer:CALayer,_ name:String,_ level:Int,_ window:UIWindow) {
        if level>14{return}
        let frame=layer.convert(layer.bounds,to:window.layer)
        if [frame.minX,frame.minY,frame.width,frame.height,layer.cornerRadius,CGFloat(layer.opacity)].allSatisfy({ $0.isFinite }) { rows.append(["kind":name,"x":frame.minX,"y":frame.minY,"width":frame.width,"height":frame.height,"radius":layer.cornerRadius,"curve":layer.cornerCurve.rawValue,"opacity":layer.opacity]) }
        for child in layer.sublayers ?? [] {record(child,String(describing:type(of:child)),level+1,window)}
    }
    for scene in UIApplication.shared.connectedScenes.compactMap({$0 as? UIWindowScene}) {
        for window in scene.windows where !window.isHidden { record(window.layer,"UIWindow",0,window) }
    }
    let path=FileManager.default.urls(for:.documentDirectory,in:.userDomainMask)[0].appendingPathComponent("catalog-geometry.json")
    if let data=try? JSONSerialization.data(withJSONObject:["page":page,"layers":rows],options:[.prettyPrinted,.sortedKeys]) {try? data.write(to:path)}
    let format=UIGraphicsImageRendererFormat();format.scale=3;format.opaque=false
    let corner=UIView(frame:CGRect(x:0,y:0,width:320,height:172));corner.backgroundColor = .white;corner.layer.cornerRadius=34;corner.layer.cornerCurve = .continuous;corner.layer.masksToBounds=true
    let image=UIGraphicsImageRenderer(size:corner.bounds.size,format:format).image {ctx in corner.layer.render(in:ctx.cgContext)}
    if let data=image.pngData(){try? data.write(to:path.deletingLastPathComponent().appendingPathComponent("continuous-mask.png"))}
}
