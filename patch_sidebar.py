with open('/etc/docker/workspace_os/app/components/Layout/Sidebar.tsx', 'r') as f:
    content = f.read()

OLD = """                  {[
                    { id: View.SLIDES_STUDIO_DASHBOARD, label: 'Biblioteca', icon: LayoutDashboard },
                    { id: View.SLIDES_STUDIO_NEW, label: 'Nova Apresentação', icon: Presentation },
                  ].map((subItem) => (
                    <button
                      key={subItem.id}
                      onClick={() => onNavigate(subItem.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2 rounded-r-full text-xs font-medium transition-all ${
                        currentView === subItem.id
                          ? 'text-violet-400 bg-violet-500/10'
                          : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      <subItem.icon size={13} />
                      <span>{subItem.label}</span>
                    </button>
                  ))}
                </div>"""

NEW = """                  {[
                    { id: View.SLIDES_STUDIO_DASHBOARD, label: 'Biblioteca', icon: LayoutDashboard },
                    { id: View.SLIDES_STUDIO_NEW, label: 'Nova Apresentação', icon: Presentation },
                  ].map((subItem) => (
                    <button
                      key={subItem.id}
                      onClick={() => onNavigate(subItem.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2 rounded-r-full text-xs font-medium transition-all ${
                        currentView === subItem.id
                          ? 'text-violet-400 bg-violet-500/10'
                          : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      <subItem.icon size={13} />
                      <span>{subItem.label}</span>
                    </button>
                  ))}
                  <a
                    href="/slides"
                    className="w-full flex items-center gap-3 px-4 py-2 rounded-r-full text-xs font-medium transition-all text-gray-500 hover:text-violet-400"
                  >
                    <Presentation size={13} />
                    <span>Slide Creator IA</span>
                  </a>
                </div>"""

if OLD in content:
    content = content.replace(OLD, NEW)
    with open('/etc/docker/workspace_os/app/components/Layout/Sidebar.tsx', 'w') as f:
        f.write(content)
    print('PATCH OK')
else:
    print('PATCH FAILED - string not found')
